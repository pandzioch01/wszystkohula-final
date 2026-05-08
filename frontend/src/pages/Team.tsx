import { useState } from 'react';
import { useMembers, useMember } from '../hooks/useMembers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { SearchableList } from '../components/SearchableList';
import type { MemberSearchResult } from '../types/api';

function MemberDetail({ id }: { id: number }) {
  const { data, isLoading, error } = useMember(id);

  if (isLoading) return <p>Loading details…</p>;
  if (error) return <p className="text-red-500">Failed to load member.</p>;
  if (!data) return null;

  return (
    <div className="border rounded p-4 space-y-3">
      <h2 className="text-xl font-semibold">{data.name ?? '(no name)'}</h2>
      {data.city && <p className="text-gray-600">{data.city}</p>}

      {data.specializations.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700">Specializations</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.specializations.map((s) => (
              <span
                key={s}
                className="bg-gray-100 text-gray-800 text-xs rounded px-2 py-0.5"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.ownedTools.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700">Owned tools</div>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {data.ownedTools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {data.borrowedTools.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700">Borrowed (currently held)</div>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {data.borrowedTools.map((t) => (
              <li key={t.name}>
                {t.name} <span className="text-gray-500">— {t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.nextEvent && (
        <div>
          <div className="text-sm font-medium text-gray-700">Next event</div>
          <div className="text-sm">
            {data.nextEvent.title}{' '}
            <span className="text-gray-500">
              ({new Date(data.nextEvent.startDate).toLocaleString()})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const { data, isLoading, error } = useMembers(debouncedQ || undefined);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Team</h1>

      <SearchableList<MemberSearchResult>
        items={data}
        isLoading={isLoading}
        error={error}
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search by name…"
        getItemId={(m) => m.id}
        renderItem={(m) => (
          <span className="font-medium">{m.name ?? '(no name)'}</span>
        )}
        renderDetail={(id) => <MemberDetail id={Number(id)} />}
        emptyMessage="No members match."
      />
    </div>
  );
}
