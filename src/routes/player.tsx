import { createFileRoute } from '@tanstack/react-router';
import { PlayerView } from '../components/PlayerView';

export const Route = createFileRoute('/player')({
  component: PlayerView,
});
