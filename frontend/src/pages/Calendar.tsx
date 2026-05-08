import { useState } from 'react';
import {
  useEvents,
  useEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '../hooks/useEvents';
import type { EventListItem } from '../types/api';
import { CURRENT_MEMBER_ID } from '../lib/auth';

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

// Convert ISO string -> the format <input type="datetime-local"> expects
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Calendar() {
  const { data: events, isLoading, error } = useEvents();
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();
  const deleteMut = useDeleteEvent();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Fetch full details when editing so description/clientName/firmsNames pre-fill.
  const editingQuery = useEvent(editingId ?? undefined);

  // Adjust form state during render when fetched data arrives for a new id.
  // The guard (loadedForId !== editingId) prevents infinite loops.
  const [loadedForId, setLoadedForId] = useState<number | null>(null);
  if (
    editingId !== null &&
    editingQuery.data &&
    loadedForId !== editingId
  ) {
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(e: EventListItem) {
    setEditingId(e.id);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
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
      actorMemberId: CURRENT_MEMBER_ID,
    };

    if (editingId === null) {
      await createMut.mutateAsync(payload);
    } else {
      await updateMut.mutateAsync({ id: editingId, payload });
    }
    closeForm();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this event?')) return;
    await deleteMut.mutateAsync({ id, actorMemberId: CURRENT_MEMBER_ID });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
        >
          + Add event
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="border rounded p-4 mb-6 space-y-3 max-w-2xl"
        >
          <h2 className="font-semibold">
            {editingId === null ? 'New event' : `Edit event #${editingId}`}
          </h2>

          {editingId !== null && editingQuery.isLoading && (
            <p className="text-sm text-gray-500">Loading event…</p>
          )}

          {(editingId === null || editingQuery.data) && (
          <>
          <div>
            <label className="block text-sm">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border rounded p-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded p-2 w-full"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm">Client name</label>
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="border rounded p-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Firms (comma-separated)</label>
            <input
              value={form.firmsNames}
              onChange={(e) => setForm({ ...form, firmsNames: e.target.value })}
              className="border rounded p-2 w-full"
              placeholder="AudioPro, LightWorks"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm">Start</label>
              <input
                required
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm">End</label>
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={
                createMut.isPending ||
                updateMut.isPending ||
                (editingId !== null && editingQuery.isLoading)
              }
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded"
            >
              {editingId === null ? 'Create' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="border px-3 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>

          {(createMut.error || updateMut.error) && (
            <p className="text-red-500 text-sm">Save failed. Check the console.</p>
          )}
        </form>
      )}

      {isLoading && <p>Loading events…</p>}
      {error && <p className="text-red-500">Failed to load events.</p>}

      <ul className="space-y-2">
        {events?.map((e) => (
          <li key={e.id} className="border rounded p-3 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-sm text-gray-500">
                {new Date(e.startDate).toLocaleString()} → {new Date(e.endDate).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openEdit(e)}
                className="border px-2 py-1 rounded text-sm hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                disabled={deleteMut.isPending}
                className="border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-50 px-2 py-1 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
