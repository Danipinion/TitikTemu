import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { writeFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to save Base64 data strings as JPEG images on local disk
const saveBase64Image = (base64Str: string, prefix: string): string => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str; // Return as-is if already a path or empty
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filepath = join(UPLOADS_DIR, filename);
    writeFileSync(filepath, buffer);
    console.log(`Saved image to disk: ${filepath}`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving image to disk:', err);
    return base64Str;
  }
};

// Interfaces for State Tracking
interface PlayerSession {
  name: string;
  socket: WebSocket;
  joinedAt: Date;
  identityPhoto?: string;
}

interface RoomSession {
  pin: string;
  hostSocket: WebSocket | null;
  currentChallengeIndex: number; // 0 = Lobby, 1-10 = Challenges, 11 = Climax Gallery
  players: Map<string, PlayerSession>; // Map name -> PlayerSession
  submissions: any[];
}

const rooms = new Map<string, RoomSession>();

const server = createServer((req, res) => {
  const url = req.url || '/';

  // 1. Serve static files from the uploads/ directory
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    // Clean filename to prevent path traversal
    const safeFilename = filename.replace(/\.\./g, '');
    const filePath = join(UPLOADS_DIR, safeFilename);

    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';

      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(readFileSync(filePath));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // 2. Serve static files from the dist/ directory in production build
  const distPath = join(process.cwd(), 'dist');
  if (existsSync(distPath)) {
    const cleanUrl = url.split('?')[0];
    let filePath = join(distPath, cleanUrl);

    // SPA routing fallback: if request is a directory or path does not exist, serve index.html
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(distPath, 'index.html');
    }

    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath).toLowerCase();
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.ico') contentType = 'image/x-icon';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.json') contentType = 'application/json';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(readFileSync(filePath));
      return;
    }
  }

  // Fallback for development
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>TitikTemu Server</h1><p>Running development mode. WebSocket on port 8080.</p>');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

console.log('Starting Real-time Game Sync Server...');

wss.on('connection', (ws: WebSocket) => {
  let userPin: string | null = null;
  let userName: string | null = null;
  let userRole: 'host' | 'player' | null = null;

  const send = (socket: WebSocket, data: any) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  const broadcastToRoom = (pin: string, data: any, excludeSocket?: WebSocket) => {
    const room = rooms.get(pin);
    if (!room) return;

    if (room.hostSocket && room.hostSocket !== excludeSocket) {
      send(room.hostSocket, data);
    }

    for (const player of room.players.values()) {
      if (player.socket !== excludeSocket) {
        send(player.socket, data);
      }
    }
  };

  ws.on('message', (message: string) => {
    try {
      const payload = JSON.parse(message);
      const { type, pin, name, challengeIndex, challengeId, photoUrl, answer, identityPhoto, detectedPlayers } = payload;

      switch (type) {
        case 'create-room': {
          userPin = pin;
          userRole = 'host';
          
          if (!rooms.has(pin)) {
            rooms.set(pin, {
              pin,
              hostSocket: ws,
              currentChallengeIndex: 0,
              players: new Map(),
              submissions: [],
            });
            console.log(`Room [${pin}] created by Host.`);
          } else {
            const existingRoom = rooms.get(pin)!;
            existingRoom.hostSocket = ws;
            console.log(`Host re-connected to Room [${pin}].`);
          }
          
          send(ws, { type: 'room-created', pin });
          break;
        }

        case 'join-room': {
          if (!pin || !name) {
            send(ws, { type: 'error', message: 'PIN and Name are required.' });
            return;
          }

          const room = rooms.get(pin);
          if (!room) {
            send(ws, { type: 'error', message: 'Room not found.' });
            return;
          }

          userPin = pin;
          userName = name;
          userRole = 'player';

          // Save identity photo to local disk
          const savedIdentityPhoto = identityPhoto ? saveBase64Image(identityPhoto, `profile_${name.replace(/\s+/g, '_')}`) : '';

          // Add or update player in room state
          room.players.set(name, {
            name,
            socket: ws,
            joinedAt: new Date(),
            identityPhoto: savedIdentityPhoto,
          });

          console.log(`Player [${name}] joined Room [${pin}].`);

          // Tell the player they joined successfully, along with current room state
          send(ws, { 
            type: 'joined-success', 
            pin, 
            name, 
            currentChallengeIndex: room.currentChallengeIndex,
            submissions: room.currentChallengeIndex === 11 ? room.submissions : undefined
          });

          // Notify Host of the new player list (with photo metadata)
          if (room.hostSocket) {
            const playersList = Array.from(room.players.values()).map(p => ({
              name: p.name,
              identityPhoto: p.identityPhoto
            }));
            send(room.hostSocket, {
              type: 'player-joined',
              name,
              playersList,
            });
          }
          break;
        }

        case 'next-challenge': {
          if (!userPin || userRole !== 'host') {
            send(ws, { type: 'error', message: 'Unauthorized state update.' });
            return;
          }

          const room = rooms.get(userPin);
          if (room) {
            room.currentChallengeIndex = challengeIndex;
            console.log(`Room [${userPin}] advanced to stage ${challengeIndex}.`);

            // If resetting back to lobby (stage 0), clear all game submissions
            if (challengeIndex === 0) {
              room.submissions = [];
              console.log(`Room [${userPin}] submissions cleared for new session.`);
            }

            // Broadcast the new stage to all players in the room
            broadcastToRoom(userPin, {
              type: 'challenge-changed',
              challengeIndex,
              submissions: challengeIndex === 11 ? room.submissions : undefined
            });
          }
          break;
        }

        case 'submit-answer': {
          if (!userPin || !userName || userRole !== 'player') {
            send(ws, { type: 'error', message: 'Only connected players can submit answers.' });
            return;
          }

          const room = rooms.get(userPin);
          if (room) {
            console.log(`Player [${userName}] in Room [${userPin}] submitted challenge ${challengeId}.`);

            const savedPhotoUrl = saveBase64Image(photoUrl, `challenge_${challengeId}_${userName.replace(/\s+/g, '_')}`);

            const newSubmission = {
              playerName: userName,
              challengeId,
              photoUrl: savedPhotoUrl,
              answer,
              detectedPlayers: detectedPlayers || [],
            };
            room.submissions.push(newSubmission);

            // Notify host with player's submission details (with detected player tags)
            if (room.hostSocket) {
              send(room.hostSocket, {
                type: 'submission-received',
                ...newSubmission
              });
            }
          }
          break;
        }

        default:
          send(ws, { type: 'error', message: 'Unknown event type.' });
      }
    } catch (err: any) {
      console.error('Error handling message:', err);
      send(ws, { type: 'error', message: 'Internal server message processing error.' });
    }
  });

  ws.on('close', () => {
    if (userPin && userRole === 'player' && userName) {
      const room = rooms.get(userPin);
      if (room) {
        room.players.delete(userName);
        console.log(`Player [${userName}] left Room [${userPin}].`);
        
        // Notify Host
        if (room.hostSocket) {
          const playersList = Array.from(room.players.values()).map(p => ({
            name: p.name,
            identityPhoto: p.identityPhoto
          }));
          send(room.hostSocket, {
            type: 'player-left',
            name: userName,
            playersList,
          });
        }
      }
    } else if (userPin && userRole === 'host') {
      const room = rooms.get(userPin);
      if (room) {
        room.hostSocket = null;
        console.log(`Host disconnected from Room [${userPin}]. Room remains active.`);
      }
    }
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : (process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket & Static Server listening on port ${PORT}`);
});
