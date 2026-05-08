import { api } from '../lib/api';
import type {
  MemberSearchResult,
  MemberProfile,
  MemberNotification,
} from '../types/api';

export async function searchMembers(q?: string): Promise<MemberSearchResult[]> {
  const { data } = await api.get<MemberSearchResult[]>('/api/members', {
    params: q ? { q } : undefined,
  });
  return data;
}

export async function fetchMember(id: number): Promise<MemberProfile> {
  const { data } = await api.get<MemberProfile>(`/api/members/${id}`);
  return data;
}

export async function fetchMemberNotifications(id: number): Promise<MemberNotification[]> {
  const { data } = await api.get<MemberNotification[]>(`/api/members/${id}/notifications`);
  return data;
}
