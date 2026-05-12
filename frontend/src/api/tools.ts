import { api } from '../lib/api';
import type { ToolSearchResult, ToolDetails, ToolStatus } from '../types/api';

export async function searchTools(
  q?: string,
  status?: ToolStatus,
): Promise<ToolSearchResult[]> {
  const params: Record<string, string> = {};
  if (q) params.q = q;
  if (status) params.status = status;
  const { data } = await api.get<ToolSearchResult[]>('/api/tools', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return data;
}

export async function fetchTool(id: number): Promise<ToolDetails> {
  const { data } = await api.get<ToolDetails>(`/api/tools/${id}`);
  return data;
}
