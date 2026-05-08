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
  // Who performed the action; backend writes an EventChange audit row when present.
  actorMemberId?: number;
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

export interface MemberProfile {
  id: number;
  name: string | null;
  city: string | null;
  specializations: string[];
  ownedTools: string[];
  borrowedTools: { name: string; status: ToolStatus }[];
  nextEvent: { id: number; title: string; startDate: string } | null;
}

export interface MemberNotification {
  id: number;
  message: string;
  changeType: ChangeType;
  // null when the event has been deleted (the SetNull cascade applies).
  eventId: number | null;
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
  owner: string | null;
  borrowedBy: { id: number; name: string | null } | null;
  borrowedSince: string | null;
  nearestEvent: { id: number; title: string; startDate: string } | null;
}
