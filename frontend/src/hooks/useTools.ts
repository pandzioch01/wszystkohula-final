import { useQuery } from '@tanstack/react-query';
import { searchTools, fetchTool } from '../api/tools';
import type { ToolStatus } from '../types/api';

export function useTools(q?: string, status?: ToolStatus) {
  return useQuery({
    queryKey: ['tools', { q, status }],
    queryFn: () => searchTools(q, status),
  });
}

export function useTool(id: number | undefined) {
  return useQuery({
    queryKey: ['tools', id],
    queryFn: () => fetchTool(id!),
    enabled: id !== undefined,
  });
}
