import { useEffect, useRef, useState, useCallback } from 'react';

export type SocketRole = 'host' | 'player';

export interface ConnectedPlayer {
  name: string;
  identityPhoto: string;
}

export interface UseWebsocketOptions {
  url?: string;
  pin: string;
  name?: string;
  role: SocketRole;
  identityPhoto?: string;
  onChallengeChanged?: (challengeIndex: number, submissions?: any[]) => void;
  onPlayerJoined?: (name: string, playersList: ConnectedPlayer[]) => void;
  onPlayerLeft?: (name: string, playersList: ConnectedPlayer[]) => void;
  onSubmissionReceived?: (submission: {
    playerName: string;
    challengeId: number;
    photoUrl: string;
    answer: string;
    detectedPlayers: string[];
  }) => void;
}

const getWsUrl = (providedUrl?: string) => {
  if (providedUrl) return providedUrl;
  if (typeof window === 'undefined') return 'ws://localhost:8080';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  // If we are developing locally on port 3000, Vite dev server is on 3000 and Websocket is on 8080.
  // In production (Docker), they are served on the same port.
  const port = window.location.port === '3000' || window.location.port === '3002' ? '8080' : window.location.port;
  return `${protocol}//${host}${port ? `:${port}` : ''}`;
};

export const useWebsocket = ({
  url,
  pin,
  name,
  role,
  identityPhoto,
  onChallengeChanged,
  onPlayerJoined,
  onPlayerLeft,
  onSubmissionReceived,
}: UseWebsocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playersList, setPlayersList] = useState<ConnectedPlayer[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const callbacksRef = useRef({
    onChallengeChanged,
    onPlayerJoined,
    onPlayerLeft,
    onSubmissionReceived,
  });

  // Keep callbacks fresh on every render
  useEffect(() => {
    callbacksRef.current = {
      onChallengeChanged,
      onPlayerJoined,
      onPlayerLeft,
      onSubmissionReceived,
    };
  });

  const connect = useCallback(() => {
    if (!pin) return;

    const resolvedUrl = getWsUrl(url);

    // Clean up any existing connection
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
    }

    console.log(`Connecting to WebSocket: ${resolvedUrl}`);
    const socket = new WebSocket(resolvedUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected successfully.');
      setIsConnected(true);
      setError(null);

      // Authenticate/Join immediately upon connection
      if (role === 'host') {
        socket.send(JSON.stringify({ type: 'create-room', pin }));
      } else {
        socket.send(JSON.stringify({ type: 'join-room', pin, name, identityPhoto }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('WS Message received:', payload);

        switch (payload.type) {
          case 'room-created':
            console.log(`Room ${payload.pin} verified on server.`);
            break;

          case 'joined-success':
            console.log(`Successfully joined room ${payload.pin} as ${payload.name}`);
            setCurrentChallengeIndex(payload.currentChallengeIndex);
            if (callbacksRef.current.onChallengeChanged) {
              callbacksRef.current.onChallengeChanged(payload.currentChallengeIndex, payload.submissions);
            }
            break;

          case 'player-joined':
            setPlayersList(payload.playersList);
            if (callbacksRef.current.onPlayerJoined) {
              callbacksRef.current.onPlayerJoined(payload.name, payload.playersList);
            }
            break;

          case 'player-left':
            setPlayersList(payload.playersList);
            if (callbacksRef.current.onPlayerLeft) {
              callbacksRef.current.onPlayerLeft(payload.name, payload.playersList);
            }
            break;

          case 'challenge-changed':
            setCurrentChallengeIndex(payload.challengeIndex);
            if (callbacksRef.current.onChallengeChanged) {
              callbacksRef.current.onChallengeChanged(payload.challengeIndex, payload.submissions);
            }
            break;

          case 'submission-received':
            if (callbacksRef.current.onSubmissionReceived) {
              callbacksRef.current.onSubmissionReceived({
                playerName: payload.playerName,
                challengeId: payload.challengeId,
                photoUrl: payload.photoUrl,
                answer: payload.answer,
                detectedPlayers: payload.detectedPlayers || [],
              });
            }
            break;

          case 'error':
            setError(payload.message);
            console.error('WS Server side error:', payload.message);
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.onerror = (evt) => {
      console.error('WebSocket connection error:', evt);
      setError('Gagal terhubung ke server real-time.');
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed.');
      setIsConnected(false);

      // Attempt reconnection after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        console.log('Reconnecting WebSocket...');
        connect();
      }, 3000);
    };
  }, [url, pin, name, role, identityPhoto]);

  // Trigger state transition to next challenge (Host only)
  const sendNextChallenge = useCallback((challengeIndex: number) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && role === 'host') {
      ws.current.send(
        JSON.stringify({
          type: 'next-challenge',
          pin,
          challengeIndex,
        })
      );
      setCurrentChallengeIndex(challengeIndex);
    } else {
      console.warn('Cannot update state, WebSocket is not open or role is not host.');
    }
  }, [pin, role]);

  // Submit response (Player only)
  const sendSubmission = useCallback((challengeId: number, photoUrl: string, answer: string, detectedPlayers: string[]) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && role === 'player') {
      ws.current.send(
        JSON.stringify({
          type: 'submit-answer',
          pin,
          name,
          challengeId,
          photoUrl,
          answer,
          detectedPlayers,
        })
      );
    } else {
      console.warn('Cannot send submission, WebSocket is not open or role is not player.');
    }
  }, [pin, name, role]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return {
    isConnected,
    error,
    playersList,
    currentChallengeIndex,
    sendNextChallenge,
    sendSubmission,
  };
};
