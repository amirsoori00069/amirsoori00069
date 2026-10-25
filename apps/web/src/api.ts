import type { Note, Section } from "./types";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `خطای سرور (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchSections(): Promise<Section[]> {
  const data = await parseJson<{ sections: Section[] }>(
    await fetch("/api/sections"),
  );
  return data.sections;
}

export async function fetchNotes(): Promise<Note[]> {
  const data = await parseJson<{ notes: Note[] }>(await fetch("/api/notes"));
  return data.notes;
}

export async function createNote(input: {
  itemId: string;
  displayName: string;
  body: string;
}): Promise<Note> {
  const data = await parseJson<{ note: Note }>(
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.note;
}

export async function removeNote(
  noteId: string,
  displayName: string,
): Promise<void> {
  await parseJson(
    await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    }),
  );
}

export type ExportPayload = {
  markdown: string;
  json: unknown;
  filenames: { markdown: string; json: string };
};

export async function fetchExport(): Promise<ExportPayload> {
  return parseJson<ExportPayload>(await fetch("/api/export"));
}
