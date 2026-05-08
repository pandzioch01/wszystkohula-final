import { useState } from 'react';
import { Modal } from '../Modal';
import { useEvent, useCreateEvent, useUpdateEvent } from '../../hooks/useEvents';

interface EventFormModalProps {
  /** null = closed; number = edit that id; 'create' = new event */
  mode: number | 'create' | null;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  clientName: string;
  firmsNames: string;
  startDate: string;
  endDate: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  clientName: '',
  firmsNames: '',
  startDate: '',
  endDate: '',
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormModal({ mode, onClose }: EventFormModalProps) {
  const editingId = typeof mode === 'number' ? mode : null;
  const isCreate = mode === 'create';
  const open = mode !== null;

  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();

  const [form, setForm] = useState<FormState>(emptyForm);
  const editingQuery = useEvent(editingId ?? undefined);

  // Adjust state during render when fetched data arrives for a new id (or
  // when switching out of edit mode). The guards prevent infinite loops.
  const [loadedForId, setLoadedForId] = useState<number | null>(null);
  if (editingId !== null && editingQuery.data && loadedForId !== editingId) {
    const d = editingQuery.data;
    setLoadedForId(editingId);
    setForm({
      title: d.title,
      description: d.description ?? '',
      clientName: d.clientName ?? '',
      firmsNames: d.firmsNames.join(', '),
      startDate: toLocalInput(d.startDate),
      endDate: toLocalInput(d.endDate),
    });
  }
  if (isCreate && loadedForId !== null) {
    setLoadedForId(null);
    setForm(emptyForm);
  }

  function close() {
    onClose();
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      clientName: form.clientName.trim() || null,
      firmsNames: form.firmsNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    };

    if (editingId === null) {
      await createMut.mutateAsync(payload);
    } else {
      await updateMut.mutateAsync({ id: editingId, payload });
    }
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editingId === null ? 'Nowy event' : `Edytuj event #${editingId}`}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {editingId !== null && editingQuery.isLoading && (
          <p className="text-sm text-gray-500">Loading event…</p>
        )}

        {(editingId === null || editingQuery.data) && (
          <>
            <div>
              <label className="block text-sm">Tytuł</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm">Opis</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border rounded p-2 w-full"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm">Klient</label>
              <input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm">Firmy (po przecinku)</label>
              <input
                value={form.firmsNames}
                onChange={(e) => setForm({ ...form, firmsNames: e.target.value })}
                className="border rounded p-2 w-full"
                placeholder="AudioPro, LightWorks"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm">Początek</label>
                <input
                  required
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm">Koniec</label>
                <input
                  required
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="border rounded p-2 w-full"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            type="submit"
            disabled={
              createMut.isPending ||
              updateMut.isPending ||
              (editingId !== null && editingQuery.isLoading)
            }
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded"
          >
            {editingId === null ? 'Utwórz' : 'Zapisz'}
          </button>
          <button
            type="button"
            onClick={close}
            className="border px-3 py-1.5 rounded"
          >
            Anuluj
          </button>
        </div>

        {(createMut.error || updateMut.error) && (
          <p className="text-red-500 text-sm">Save failed. Check the console.</p>
        )}
      </form>
    </Modal>
  );
}
