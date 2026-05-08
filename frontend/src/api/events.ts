import { api } from '../lib/api';
import type {
  EventListItem,
  EventDetails,
  EventCreatePayload,
  EventUpdatePayload,
} from '../types/api';

export async function fetchEvents(params: { start?: string; end?: string } = {}): Promise<EventListItem[]> {
  const { data } = await api.get<EventListItem[]>('/api/events', { params });
  return data;
}

export async function fetchEvent(id: number): Promise<EventDetails> {
  const { data } = await api.get<EventDetails>(`/api/events/${id}`);
  return data;
}

export async function createEvent(payload: EventCreatePayload): Promise<EventDetails> {
  const { data } = await api.post<EventDetails>('/api/events', payload);
  return data;
}

export async function updateEvent(id: number, payload: EventUpdatePayload): Promise<EventDetails> {
  const { data } = await api.patch<EventDetails>(`/api/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id: number, actorMemberId?: number): Promise<void> {
  await api.delete(`/api/events/${id}`, {
    params: actorMemberId !== undefined ? { actorMemberId } : undefined,
  });
}
