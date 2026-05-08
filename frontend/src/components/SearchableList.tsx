import { useState, type ReactNode } from 'react';

type ItemId = number | string;

export interface SearchableListProps<T> {
  /** Items to render (already fetched + filtered by the caller). */
  items: T[] | undefined;
  isLoading: boolean;
  error: unknown;

  /** Controlled search input. The caller decides how to apply the value
   *  (debouncing, server-side query, client-side filter — all up to it). */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** Extract a stable id used for selection + React key. */
  getItemId: (item: T) => ItemId;

  /** Render one row. `isSelected` lets the caller style the selected row. */
  renderItem: (item: T, isSelected: boolean) => ReactNode;

  /** Render the detail panel for the selected id. Omit to use as a plain list. */
  renderDetail?: (id: ItemId) => ReactNode;

  /** Shown when `items` is an empty array (not while loading). */
  emptyMessage?: string;
}

/**
 * Master-detail list with a search input. Generic over T so the same component
 * powers the Team page (members) and the Storage page (tools). Selection state
 * lives inside; data fetching and row/detail rendering are passed as props.
 */
export function SearchableList<T>({
  items,
  isLoading,
  error,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  getItemId,
  renderItem,
  renderDetail,
  emptyMessage = 'No results.',
}: SearchableListProps<T>) {
  const [selectedId, setSelectedId] = useState<ItemId | null>(null);

  // If the currently-selected item disappears from the list (filtered out by
  // search, deleted, etc.), clear the selection so the detail panel hides.
  if (
    selectedId !== null &&
    items &&
    !items.some((item) => getItemId(item) === selectedId)
  ) {
    setSelectedId(null);
  }

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0 max-w-md">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border rounded p-2 w-full mb-4"
        />

        {isLoading && <p>Loading…</p>}
        {error !== null && error !== undefined && (
          <p className="text-red-500">Failed to load.</p>
        )}

        <ul className="space-y-2">
          {items?.map((item) => {
            const id = getItemId(item);
            const isSelected = id === selectedId;
            return (
              <li
                key={id}
                onClick={() => setSelectedId(id)}
                className={`border rounded p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                {renderItem(item, isSelected)}
              </li>
            );
          })}
        </ul>

        {!isLoading && items && items.length === 0 && (
          <p className="text-gray-500 mt-2">{emptyMessage}</p>
        )}
      </div>

      {selectedId !== null && renderDetail && (
        <div className="flex-1 min-w-0">{renderDetail(selectedId)}</div>
      )}
    </div>
  );
}
