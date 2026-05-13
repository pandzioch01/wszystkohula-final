import { Modal } from '../Modal';
import { useEvent } from '../../hooks/useEvents';

interface EventDetailsModalProps {
  eventId: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function EventDetailsModal({
  eventId,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  const { data, isLoading, error } = useEvent(eventId ?? undefined);

    function polishStatus(status: string) {
    switch (status) {
      case 'IN_STORAGE':
        return '— Obecnie w magazynie';
      case 'AT_EVENT':
        return '— Obecnie na evencie';
      case 'BORROWED':
        return '— Obecnie wypożyczony';
      case 'MAINTENANCE':
        return '— Obecnie na serwisie';
      case 'LOST':
        return '— Obecnie zagubione';
      default:
        return status;
    }
  }

  return (
    <Modal open={eventId !== null} onClose={onClose} title="Event">
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-500">Failed to load event.</p>}

      {data && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-semibold">{data.title}</h3>
            <div className="text-sm text-gray-600">
              {new Date(data.startDate).toLocaleString()} →{' '}
              {new Date(data.endDate).toLocaleString()}
            </div>
          </div>

          {data.description && (
            <div>
              <div className="text-sm font-medium text-gray-700">Opis</div>
              <p className="text-sm whitespace-pre-wrap">{data.description}</p>
            </div>
          )}

          {data.clientName && (
            <div>
              <div className="text-sm font-medium text-gray-700">Klient</div>
              <p className="text-sm">{data.clientName}</p>
            </div>
          )}

          {data.firmsNames.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700">Firmy</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.firmsNames.map((f) => (
                  <span
                    key={f}
                    className="bg-gray-100 text-gray-800 text-xs rounded px-2 py-0.5"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.participants.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700">Uczestnicy</div>
              <ul className="list-disc list-inside text-sm">
                {data.participants.map((p) => (
                  <li key={p.id}>{p.name ?? '(bez imienia)'}</li>
                ))}
              </ul>
            </div>
          )}

          {data.tools.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700">Sprzęt</div>
              <ul className="list-disc list-inside text-sm">
                {data.tools.map((t) => (
                  <li key={t.id}>
                    {t.name}{' '}
                    <span className="text-gray-500">{polishStatus(t.status)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onEdit(data.id)}
              className="border px-3 py-1.5 rounded hover:bg-gray-50"
            >
              Edytuj
            </button>
            <button
              type="button"
              onClick={() => onDelete(data.id)}
              className="border border-red-400 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded"
            >
              Usuń
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto border px-3 py-1.5 rounded hover:bg-gray-50"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
