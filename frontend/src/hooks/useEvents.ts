import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../api/events';
import type { EventCreatePayload, EventUpdatePayload } from '../types/api';

export function useEvents(params: { start?: string; end?: string } = {}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => fetchEvents(params),
  });
}

export function useEvent(id: number | undefined) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => fetchEvent(id!),
    enabled: id !== undefined,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventCreatePayload) => createEvent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      // The mutation also wrote an EventChange audit row, so the
      // notifications feed needs to refresh.
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EventUpdatePayload }) =>
      updateEvent(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events', vars.id] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actorMemberId }: { id: number; actorMemberId?: number }) =>
      deleteEvent(id, actorMemberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      // The mutation also wrote a DELETED audit row, so refresh notifications.
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
