import { useQuery } from '@tanstack/react-query';
import { searchMembers, fetchMemberNotifications } from '../api/members';

export function useMembers(q?: string) {
  return useQuery({
    queryKey: ['members', { q }],
    queryFn: () => searchMembers(q),
  });
}

export function useMemberNotifications(id: number | undefined) {
  return useQuery({
    queryKey: ['members', id, 'notifications'],
    queryFn: () => fetchMemberNotifications(id!),
    enabled: id !== undefined,
  });
}
