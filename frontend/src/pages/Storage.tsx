import { useState } from 'react';
import { useTools, useTool } from '../hooks/useTools';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { SearchableList } from '../components/SearchableList';
import type { ToolSearchResult, ToolStatus } from '../types/api';

const STATUS_OPTIONS: { value: '' | ToolStatus; label: string }[] = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'IN_STORAGE', label: 'W magazynie' },
  { value: 'AT_EVENT', label: 'Na evencie' },
  { value: 'BORROWED', label: 'Pożyczone' },
  { value: 'MAINTENANCE', label: 'Serwis' },
  { value: 'LOST', label: 'Zagubione' },
];

const STATUS_COLORS: Record<ToolStatus, string> = {
  IN_STORAGE: 'text-green-600',
  AT_EVENT: 'text-blue-600',
  BORROWED: 'text-orange-600',
  MAINTENANCE: 'text-amber-600',
  LOST: 'text-red-600',
};

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
          <div className={`text-sm font-medium ${STATUS_COLORS[data.status]}`}>
            {polishStatus(data.status)}
          </div>
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
          <div className="text-sm font-medium text-gray-700">
            {data.status === 'AT_EVENT' ? 'At event' : 'Nearest event'}
          </div>
          <div className="text-sm">
            {data.nearestEvent.title}{' '}
            <span className="text-gray-500">
              {data.status === 'AT_EVENT'
                ? `until ${new Date(data.nearestEvent.endDate).toLocaleString()}`
                : `(${new Date(data.nearestEvent.startDate).toLocaleString()})`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const polishStatus = (status: ToolStatus) => {
          switch (status) {
            case 'IN_STORAGE':
              return 'W magazynie';
            case 'AT_EVENT':
              return 'Na evencie';
            case 'BORROWED':
              return 'Pożyczone';
            case 'MAINTENANCE':
              return 'Serwis';
            case 'LOST':
              return 'Zagubione';
          }
        };
      
export default function Storage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | ToolStatus>('');
  const debouncedQ = useDebouncedValue(q);
  const { data, isLoading, error } = useTools(
    debouncedQ || undefined,
    status || undefined,
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Storage</h1>

      <div className="mb-4 max-w-md">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | ToolStatus)}
          className="border rounded p-2 w-full"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <SearchableList<ToolSearchResult>
        items={data}
        isLoading={isLoading}
        error={error}
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Szukaj po nazwie lub właścicielu…"
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
              <div className={`text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                {polishStatus(t.status)}
              </div>
            </div>
          </div>
        )}
        renderDetail={(id) => <ToolDetail id={Number(id)} />}
        emptyMessage="No tools match."
      />
    </div>
  );
}
