export type ToolStatus =
  | 'AVAILABLE'
  | 'IN_STORAGE'
  | 'AT_EVENT'
  | 'BORROWED'
  | 'MAINTENANCE'
  | 'LOST';

export type ChangeType =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'TOOL_ASSIGNED'
  | 'TOOL_RETURNED';

export interface EventCreatePayload {
  title: string;
  description?: string | null;
  clientName?: string | null;
  firmsNames?: string[];
  startDate: string;
  endDate: string;
}

export type EventUpdatePayload = Partial<EventCreatePayload>;

export interface EventListItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
}

export interface EventDetails {
  id: number;
  title: string;
  description: string | null;
  clientName: string | null;
  firmsNames: string[];
  startDate: string;
  endDate: string;
  participants: { id: number; name: string | null }[];
  tools: {
    id: number;
    name: string;
    status: ToolStatus;
    assignedAt: string;
    returnedAt: string | null;
  }[];
}

export interface MemberSearchResult {
  id: number;
  name: string | null;
  city: string | null;
  specializations: string[];
}

export interface MemberNotification {
  id: number;
  message: string;
  changeType: ChangeType;
  eventId: number;
  eventTitle: string;
  memberId: number;
  memberName: string | null;
  description: string | null;
  timestamp: string;
}

export interface ToolSearchResult {
  id: number;
  name: string;
  status: ToolStatus;
  imageUrl: string | null;
}

export interface ToolDetails {
  id: number;
  name: string;
  status: ToolStatus;
  imageUrl: string | null;
  borrowedBy: { id: number; name: string | null } | null;
  borrowedSince: string | null;
  nearestEvent: { id: number; title: string; startDate: string } | null;
}
