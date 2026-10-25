import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createNote,
  fetchExport,
  fetchNotes,
  fetchSections,
  removeNote,
} from "./api";
import type { Note, Section } from "./types";

const USER_KEY = "aspina_display_name";
const THEME_KEY = "aspina_theme";

function formatFaTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem(USER_KEY) ?? "",
  );
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" ? "light" : "dark";
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme === "light" ? "light" : "dark",
    );
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const notesByItem = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const note of notes) {
      const list = map.get(note.itemId) ?? [];
      list.push(note);
      map.set(note.itemId, list);
    }
    return map;
  }, [notes]);

  async function refreshAll(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const [nextSections, nextNotes] = await Promise.all([
        fetchSections(),
        fetchNotes(),
      ]);
      setSections(nextSections);
      setNotes(nextNotes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت داده");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll(true);
    const id = window.setInterval(() => {
      void refreshAll(false);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("displayName") ?? "").trim();
    if (!value) return;
    localStorage.setItem(USER_KEY, value);
    setDisplayName(value);
  }

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleAddNote(itemId: string) {
    const body = (drafts[itemId] ?? "").trim();
    if (!body || !displayName) return;
    try {
      await createNote({ itemId, displayName, body });
      setDrafts((prev) => ({ ...prev, [itemId]: "" }));
      await refreshAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت یادداشت ناموفق بود");
    }
  }

  async function handleDeleteNote(note: Note) {
    try {
      await removeNote(note.id, displayName);
      await refreshAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف یادداشت ناموفق بود");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const payload = await fetchExport();
      downloadBlob(
        payload.filenames.markdown,
        payload.markdown,
        "text/markdown;charset=utf-8",
      );
      downloadBlob(
        payload.filenames.json,
        JSON.stringify(payload.json, null, 2),
        "application/json;charset=utf-8",
      );
      setToast("بسته Markdown و JSON برای عامل کدنویسی دانلود شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خروجی‌گیری ناموفق بود");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {!displayName && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <form className="modal-content" onSubmit={saveUsername}>
            <h2 id="login-title">ورود به مستند تعاملی</h2>
            <p>
              لطفاً نام یا سمت خود را وارد کنید تا یادداشت‌ها با نام شما ثبت شوند.
            </p>
            <label className="sr-only" htmlFor="usernameInput">
              یوزرنیم
            </label>
            <input
              id="usernameInput"
              name="displayName"
              type="text"
              placeholder="مثلاً: علی (مدیر پروژه)"
              autoFocus
              autoComplete="nickname"
              maxLength={80}
              required
            />
            <button type="submit">ورود به جلسه تحلیل</button>
          </form>
        </div>
      )}

      <div className="container">
        <header className="app-header">
          <h1>
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
              <polyline points="10 9 15 12 10 15 10 9" />
            </svg>
            اکوسیستم هتلداری گروه جمالی (مستند تعاملی)
          </h1>
          <div className="header-controls">
            <span className="user-badge">
              کاربر: {displayName || "مهمان"}
            </span>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
            >
              تغییر تم
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
            >
              {exporting ? "در حال آماده‌سازی…" : "دانلود بسته برای هوش مصنوعی"}
            </button>
          </div>
        </header>

        {loading && (
          <div className="status-banner" role="status">
            در حال بارگذاری بخش‌ها…
          </div>
        )}
        {error && (
          <div className="status-banner error" role="alert">
            {error}
          </div>
        )}

        {sections.map((section) => {
          const isOpen = Boolean(openSections[section.id]);
          return (
            <article
              key={section.id}
              className={`section-card${isOpen ? " open" : ""}`}
            >
              <button
                type="button"
                className="section-header"
                aria-expanded={isOpen}
                onClick={() => toggleSection(section.id)}
              >
                <h2>{section.title}</h2>
                <span className="chevron" aria-hidden="true">
                  ▼
                </span>
              </button>
              {isOpen && (
                <div className="section-body">
                  {section.items.map((item) => {
                    const itemNotes = notesByItem.get(item.id) ?? [];
                    return (
                      <div key={item.id} className="item-row">
                        <div className="item-title">{item.title}</div>
                        <div className="item-desc">{item.description}</div>
                        <div className="notes-area">
                          {itemNotes.length === 0 ? (
                            <div className="notes-empty">
                              هنوز یادداشتی ثبت نشده است.
                            </div>
                          ) : (
                            itemNotes.map((note) => (
                              <div key={note.id} className="note-item">
                                <div>
                                  <div className="note-meta">
                                    {note.displayName} —{" "}
                                    {formatFaTime(note.createdAt)}
                                  </div>
                                  <div>{note.body}</div>
                                </div>
                                {note.displayName === displayName && (
                                  <button
                                    type="button"
                                    className="danger-ghost"
                                    aria-label="حذف یادداشت"
                                    onClick={() => void handleDeleteNote(note)}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                          <div className="note-input-group">
                            <label className="sr-only" htmlFor={`input_${item.id}`}>
                              افزودن یادداشت برای {item.title}
                            </label>
                            <input
                              id={`input_${item.id}`}
                              type="text"
                              value={drafts[item.id] ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleAddNote(item.id);
                                }
                              }}
                              placeholder="افزودن یادداشت یا پیشنهاد فنی..."
                              disabled={!displayName}
                              maxLength={4000}
                            />
                            <button
                              type="button"
                              onClick={() => void handleAddNote(item.id)}
                              disabled={!displayName}
                            >
                              ثبت
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
