import { api } from '../lib/api';
import type { ToolSearchResult, ToolDetails } from '../types/api';

export async function searchTools(q?: string): Promise<ToolSearchResult[]> {
  const { data } = await api.get<ToolSearchResult[]>('/api/tools', {
    params: q ? { q } : undefined,
  });
  return data;
}

export async function fetchTool(id: number): Promise<ToolDetails> {
  const { data } = await api.get<ToolDetails>(`/api/tools/${id}`);
  return data;
}
