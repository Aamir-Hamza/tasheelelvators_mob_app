import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { Elevator } from './types';

export function useElevatorsQuery() {
  return useQuery({
    queryKey: ['elevators'],
    queryFn: async () => {
      const res = await api.get('/elevators');
      const rows = res.data?.data;
      return Array.isArray(rows) ? (rows as Elevator[]) : [];
    },
    refetchInterval: 3000,
    structuralSharing: false,
  });
}
