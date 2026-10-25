import cors from "@fastify/cors";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import {
  buildExportPayload,
  createNote,
  deleteNote,
  listNotes,
  listSectionsWithItems,
  migrate,
  seedIfEmpty,
} from "./db.js";

migrate();
seedIfEmpty();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/api/health", async () => ({ ok: true }));

app.get("/api/sections", async () => {
  return { sections: listSectionsWithItems() };
});

app.get<{ Querystring: { itemId?: string } }>(
  "/api/notes",
  async (request) => {
    const rows = listNotes(request.query.itemId);
    return {
      notes: rows.map((n) => ({
        id: n.id,
        itemId: n.item_id,
        displayName: n.display_name,
        body: n.body,
        createdAt: n.created_at,
      })),
    };
  },
);

app.post<{
  Body: { itemId?: string; displayName?: string; body?: string };
}>("/api/notes", async (request, reply) => {
  const itemId = request.body?.itemId?.trim();
  const displayName = request.body?.displayName?.trim();
  const body = request.body?.body?.trim();

  if (!itemId || !displayName || !body) {
    return reply.code(400).send({
      error: "itemId، displayName و body الزامی هستند.",
    });
  }
  if (displayName.length > 80 || body.length > 4000) {
    return reply.code(400).send({ error: "طول ورودی بیش از حد مجاز است." });
  }

  const note = createNote({
    id: randomUUID(),
    itemId,
    displayName,
    body,
    createdAt: new Date().toISOString(),
  });

  if (!note) {
    return reply.code(404).send({ error: "آیتم یافت نشد." });
  }

  return reply.code(201).send({
    note: {
      id: note.id,
      itemId: note.item_id,
      displayName: note.display_name,
      body: note.body,
      createdAt: note.created_at,
    },
  });
});

app.delete<{
  Params: { id: string };
  Body: { displayName?: string };
}>("/api/notes/:id", async (request, reply) => {
  const displayName = request.body?.displayName?.trim();
  if (!displayName) {
    return reply.code(400).send({ error: "displayName الزامی است." });
  }

  const result = deleteNote(request.params.id, displayName);
  if (!result.ok && result.reason === "not_found") {
    return reply.code(404).send({ error: "یادداشت یافت نشد." });
  }
  if (!result.ok && result.reason === "forbidden") {
    return reply
      .code(403)
      .send({ error: "فقط نویسنده می‌تواند یادداشت خود را حذف کند." });
  }
  return reply.code(204).send();
});

app.get("/api/export", async (_request, reply) => {
  const payload = buildExportPayload();
  return reply.send({
    markdown: payload.markdown,
    json: payload.json,
    filenames: {
      markdown: "aspina-notes-export.md",
      json: "aspina-notes-export.json",
    },
  });
});

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
