import { QueryClient } from '@tanstack/react-query';
import { Elevator } from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
    },
  },
});

export function dropElevatorFromCache(id: string) {
  queryClient.setQueryData(['elevators'], (old: Elevator[] | undefined) =>
    (old ?? []).filter((e) => e._id !== id && e.liftId !== id)
  );
  queryClient.removeQueries({ queryKey: ['elevator', id] });
  queryClient.removeQueries({ queryKey: ['telemetry', id] });
  void queryClient.invalidateQueries({ queryKey: ['elevators'] });
  void queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
  void queryClient.invalidateQueries({ queryKey: ['faults'] });
  void queryClient.invalidateQueries({ queryKey: ['emergencies'] });
  void queryClient.invalidateQueries({ queryKey: ['emergency-active'] });
  void queryClient.invalidateQueries({ queryKey: ['maintenance'] });
  void queryClient.invalidateQueries({ queryKey: ['pm-stats'] });
}
