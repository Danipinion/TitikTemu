import { createFileRoute } from '@tanstack/react-router';
import { HostView } from '../components/HostView';

export const Route = createFileRoute('/host')({
  component: HostView,
});
