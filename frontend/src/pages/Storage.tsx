import { useState } from 'react';
import { useTools } from '../hooks/useTools';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export default function Storage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const { data, isLoading, error } = useTools(debouncedQ || undefined);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Storage</h1>

      <input
        type="text"
        placeholder="Search by name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded p-2 mb-4 w-full max-w-md"
      />

      {isLoading && <p>Loading tools…</p>}
      {error && <p className="text-red-500">Failed to load tools.</p>}

      <ul className="space-y-2">
        {data?.map((t) => (
          <li key={t.id} className="border rounded p-3 flex items-center gap-3">
            {t.imageUrl && (
              <img
                src={t.imageUrl}
                alt={t.name}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-sm text-gray-500">{t.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
