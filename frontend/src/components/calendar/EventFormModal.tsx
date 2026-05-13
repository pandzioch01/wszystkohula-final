import { useState } from 'react';
import { Modal } from '../Modal';
import { useEvent, useCreateEvent, useUpdateEvent } from '../../hooks/useEvents';
import { useTools } from '../../hooks/useTools';
import type { ToolSearchResult } from '../../types/api';

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
  const [selectedToolIds, setSelectedToolIds] = useState<Set<number>>(new Set());

  const editingQuery = useEvent(editingId ?? undefined);
  // Pull the full tool list so the user can pick from existing items.
  const toolsQuery = useTools();

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
    setSelectedToolIds(new Set(d.tools.map((t) => t.id)));
  }
  if (isCreate && loadedForId !== null) {
    setLoadedForId(null);
    setForm(emptyForm);
    setSelectedToolIds(new Set());
  }

  function close() {
    onClose();
  }
  
  function polishStatus(status: string) {
    switch (status) {
      case 'IN_STORAGE':
        return 'W magazynie';
      case 'AT_EVENT':
        return 'Na evencie';
      case 'BORROWED':
        return 'Wypożyczony';
      case 'MAINTENANCE':
        return 'Na serwisie';
      case 'LOST':
        return 'Zagubiony';
      default:
        return status;
    }
  }
  function toggleTool(tool: ToolSearchResult) {
    // LOST tools can't be assigned at all.
    if (tool.status === 'LOST') return;

    setSelectedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(tool.id)) {
        next.delete(tool.id);
        return next;
      }
      // MAINTENANCE — confirm before adding.
      if (tool.status === 'MAINTENANCE') {
        const ok = window.confirm(
          `Narzędzie "${tool.name}" jest w serwisie. Czy na pewno chcesz je przypisać do eventu?`,
        );
        if (!ok) return prev;
      }
      next.add(tool.id);
      return next;
    });
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
      toolIds: Array.from(selectedToolIds),
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

            <div>
              <label className="block text-sm mb-1">Sprzęt</label>
              {toolsQuery.isLoading && (
                <p className="text-sm text-gray-500">Loading tools…</p>
              )}
              {toolsQuery.error && (
                <p className="text-sm text-red-500">Nie udało się załadować sprzętu.</p>
              )}
              {toolsQuery.data && (
                <div className="border rounded p-2 max-h-48 overflow-y-auto space-y-1">
                  {toolsQuery.data.map((tool) => {
                    const isLost = tool.status === 'LOST';
                    const isMaintenance = tool.status === 'MAINTENANCE';
                    const isChecked = selectedToolIds.has(tool.id);
                    return (
                      <label
                        key={tool.id}
                        className={`flex items-center gap-2 px-2 py-1 rounded ${
                          isLost
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isLost}
                          onChange={() => toggleTool(tool)}
                        />
                        <span className="text-sm flex-1">{tool.name}</span>
                        <span
                          className={`text-xs ${
                            isLost
                              ? 'text-gray-400'
                              : isMaintenance
                                ? 'text-amber-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {polishStatus(tool.status)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
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
