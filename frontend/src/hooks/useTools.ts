import { useQuery } from '@tanstack/react-query';
import { searchTools, fetchTool } from '../api/tools';

export function useTools(q?: string) {
  return useQuery({
    queryKey: ['tools', { q }],
    queryFn: () => searchTools(q),
  });
}

export function useTool(id: number | undefined) {
  return useQuery({
    queryKey: ['tools', id],
    queryFn: () => fetchTool(id!),
    enabled: id !== undefined,
  });
}
