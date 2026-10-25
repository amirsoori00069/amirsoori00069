import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_SECTIONS } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const dbPath = process.env.ASPINA_DB_PATH ?? path.join(dataDir, "aspina.sqlite");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

/**
 * Schema is intentionally close to a future MySQL port:
 * - TEXT ids (portable UUIDs / stable keys)
 * - ISO-8601 timestamps as TEXT
 * - No SQLite-only types beyond INTEGER for sort flags
 *
 * Production decision: MySQL/MariaDB. SQLite is for this prototype only.
 */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_items_section ON items(section_id);
    CREATE INDEX IF NOT EXISTS idx_notes_item ON notes(item_id);
    CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
  `);
}

export function seedIfEmpty(): void {
  const count = db.prepare("SELECT COUNT(*) AS c FROM sections").get() as
    | { c: number }
    | undefined;
  if ((count?.c ?? 0) > 0) return;

  const insertSection = db.prepare(
    "INSERT INTO sections (id, title, sort_order) VALUES (?, ?, ?)",
  );
  const insertItem = db.prepare(
    "INSERT INTO items (id, section_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)",
  );

  const insertAll = db.prepare("BEGIN");
  insertAll.run();
  try {
    for (const section of SEED_SECTIONS) {
      insertSection.run(section.id, section.title, section.sortOrder);
      for (const item of section.items) {
        insertItem.run(
          item.id,
          section.id,
          item.title,
          item.description,
          item.sortOrder,
        );
      }
    }
    db.prepare("COMMIT").run();
  } catch (err) {
    db.prepare("ROLLBACK").run();
    throw err;
  }
}

export type SectionRow = { id: string; title: string; sort_order: number };
export type ItemRow = {
  id: string;
  section_id: string;
  title: string;
  description: string;
  sort_order: number;
};
export type NoteRow = {
  id: string;
  item_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export function listSectionsWithItems() {
  const sections = db
    .prepare("SELECT id, title, sort_order FROM sections ORDER BY sort_order ASC")
    .all() as SectionRow[];
  const items = db
    .prepare(
      "SELECT id, section_id, title, description, sort_order FROM items ORDER BY sort_order ASC",
    )
    .all() as ItemRow[];

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    sortOrder: section.sort_order,
    items: items
      .filter((item) => item.section_id === section.id)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        sortOrder: item.sort_order,
      })),
  }));
}

export function listNotes(itemId?: string) {
  if (itemId) {
    return db
      .prepare(
        "SELECT id, item_id, display_name, body, created_at FROM notes WHERE item_id = ? ORDER BY created_at ASC",
      )
      .all(itemId) as NoteRow[];
  }
  return db
    .prepare(
      "SELECT id, item_id, display_name, body, created_at FROM notes ORDER BY created_at ASC",
    )
    .all() as NoteRow[];
}

export function createNote(input: {
  id: string;
  itemId: string;
  displayName: string;
  body: string;
  createdAt: string;
}) {
  const item = db
    .prepare("SELECT id FROM items WHERE id = ?")
    .get(input.itemId) as { id: string } | undefined;
  if (!item) return null;

  db.prepare(
    "INSERT INTO notes (id, item_id, display_name, body, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    input.id,
    input.itemId,
    input.displayName,
    input.body,
    input.createdAt,
  );

  return db
    .prepare(
      "SELECT id, item_id, display_name, body, created_at FROM notes WHERE id = ?",
    )
    .get(input.id) as NoteRow;
}

export function deleteNote(noteId: string, displayName: string) {
  const note = db
    .prepare("SELECT id, display_name FROM notes WHERE id = ?")
    .get(noteId) as { id: string; display_name: string } | undefined;
  if (!note) return { ok: false as const, reason: "not_found" as const };
  if (note.display_name !== displayName) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  db.prepare("DELETE FROM notes WHERE id = ?").run(noteId);
  return { ok: true as const };
}

export function buildExportPayload() {
  const sections = listSectionsWithItems();
  const notes = listNotes().map((n) => ({
    id: n.id,
    itemId: n.item_id,
    displayName: n.display_name,
    body: n.body,
    createdAt: n.created_at,
  }));

  const notesByItem = new Map<string, typeof notes>();
  for (const note of notes) {
    const list = notesByItem.get(note.itemId) ?? [];
    list.push(note);
    notesByItem.set(note.itemId, list);
  }

  const document = {
    product: "Aspina Analysis Studio",
    documentTitle: "اکوسیستم هتلداری گروه جمالی (مستند تعاملی)",
    exportedAt: new Date().toISOString(),
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        notes: notesByItem.get(item.id) ?? [],
      })),
    })),
  };

  const mdLines: string[] = [
    "# بسته خروجی یادداشت‌ها برای عامل کدنویسی",
    "",
    `**محصول:** Aspina Analysis Studio`,
    `**مستند:** ${document.documentTitle}`,
    `**زمان خروجی:** ${document.exportedAt}`,
    "",
    "## دستورالعمل کوتاه برای عامل کدنویسی",
    "",
    "- این بسته شامل ساختار بخش‌ها و یادداشت‌های مشترک کاربران روی هر آیتم است.",
    "- فقط بر اساس محتوای همین خروجی عمل کن؛ قوانین کسب‌وکار یا نیازمندی‌هایی که اینجا نیستند را اختراع نکن.",
    "- اگر ابهامی هست، آن را به عنوان سؤال باز علامت بزن و فرض نکن.",
    "- اولویت با یادداشت‌های جدیدتر است مگر اینکه صریحاً خلاف آن گفته شده باشد.",
    "",
    "## بخش‌ها و یادداشت‌ها",
    "",
  ];

  for (const section of document.sections) {
    mdLines.push(`### ${section.title}`);
    mdLines.push("");
    for (const item of section.items) {
      mdLines.push(`#### ${item.title}`);
      mdLines.push("");
      mdLines.push(item.description);
      mdLines.push("");
      if (item.notes.length === 0) {
        mdLines.push("_یادداشتی ثبت نشده است._");
        mdLines.push("");
        continue;
      }
      for (const note of item.notes) {
        mdLines.push(
          `- **${note.displayName}** (${note.createdAt}): ${note.body}`,
        );
      }
      mdLines.push("");
    }
  }

  return {
    markdown: mdLines.join("\n"),
    json: document,
  };
}
