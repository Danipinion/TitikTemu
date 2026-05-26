import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

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

const server = createServer();
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

          // Add or update player in room state
          room.players.set(name, {
            name,
            socket: ws,
            joinedAt: new Date(),
            identityPhoto: identityPhoto || '',
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

            const newSubmission = {
              playerName: userName,
              challengeId,
              photoUrl,
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

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;
server.listen(PORT, () => {
  console.log(`WebSocket Server listening on ws://localhost:${PORT}`);
});
