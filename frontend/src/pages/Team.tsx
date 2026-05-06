import { useState } from 'react';
import { useMembers } from '../hooks/useMembers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export default function Team() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const { data, isLoading, error } = useMembers(debouncedQ || undefined);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Team</h1>

      <input
        type="text"
        placeholder="Search by name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded p-2 mb-4 w-full max-w-md"
      />

      {isLoading && <p>Loading members…</p>}
      {error && <p className="text-red-500">Failed to load members.</p>}

      <ul className="space-y-2">
        {data?.map((m) => (
          <li key={m.id} className="border rounded p-3">
            <div className="font-medium">{m.name ?? '(no name)'}</div>
            {m.city && <div className="text-sm text-gray-500">{m.city}</div>}
            {m.specializations.length > 0 && (
              <div className="text-sm">
                Specializations: {m.specializations.join(', ')}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
