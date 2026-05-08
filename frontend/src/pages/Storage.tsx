import { useState } from 'react';
import { useTools, useTool } from '../hooks/useTools';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { SearchableList } from '../components/SearchableList';
import type { ToolSearchResult } from '../types/api';

function ToolDetail({ id }: { id: number }) {
  const { data, isLoading, error } = useTool(id);

  if (isLoading) return <p>Loading details…</p>;
  if (error) return <p className="text-red-500">Failed to load tool.</p>;
  if (!data) return null;

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-start gap-4">
        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt={data.name}
            className="w-24 h-24 object-cover rounded shrink-0"
          />
        )}
        <div>
          <h2 className="text-xl font-semibold">{data.name}</h2>
          <div className="text-sm text-gray-600">{data.status}</div>
        </div>
      </div>

      {data.owner && (
        <div>
          <div className="text-sm font-medium text-gray-700">Owner</div>
          <div className="text-sm">{data.owner}</div>
        </div>
      )}

      {data.borrowedBy && (
        <div>
          <div className="text-sm font-medium text-gray-700">Borrowed by</div>
          <div className="text-sm">
            {data.borrowedBy.name ?? '(unknown member)'}
            {data.borrowedSince && (
              <span className="text-gray-500">
                {' '}— since {new Date(data.borrowedSince).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {data.nearestEvent && (
        <div>
          <div className="text-sm font-medium text-gray-700">Nearest event</div>
          <div className="text-sm">
            {data.nearestEvent.title}{' '}
            <span className="text-gray-500">
              ({new Date(data.nearestEvent.startDate).toLocaleString()})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Storage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const { data, isLoading, error } = useTools(debouncedQ || undefined);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Storage</h1>

      <SearchableList<ToolSearchResult>
        items={data}
        isLoading={isLoading}
        error={error}
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search by name…"
        getItemId={(t) => t.id}
        renderItem={(t) => (
          <div className="flex items-center gap-3">
            {t.imageUrl && (
              <img
                src={t.imageUrl}
                alt={t.name}
                className="w-10 h-10 object-cover rounded shrink-0"
              />
            )}
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">{t.status}</div>
            </div>
          </div>
        )}
        renderDetail={(id) => <ToolDetail id={Number(id)} />}
        emptyMessage="No tools match."
      />
    </div>
  );
}
