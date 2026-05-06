import { useMemberNotifications } from '../hooks/useMembers';

// TODO: replace with the logged-in member's id from auth context
const CURRENT_MEMBER_ID = 1;

export default function Notifications() {
  const { data, isLoading, error } = useMemberNotifications(CURRENT_MEMBER_ID);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

      {isLoading && <p>Loading notifications…</p>}
      {error && <p className="text-red-500">Failed to load notifications.</p>}

      <ul className="space-y-2">
        {data?.map((n) => (
          <li key={n.id} className="border rounded p-3">
            <div>{n.message}</div>
            {n.description && (
              <div className="text-sm text-gray-600 mt-1">{n.description}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(n.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
