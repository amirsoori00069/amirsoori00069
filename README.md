# Aspina Analysis Studio

Persian-first collaborative analysis prototype (Milestone 2 notes prototype).

Monorepo:

- `apps/web` — React + TypeScript + Vite (RTL)
- `apps/api` — Node + Fastify + TypeScript + **SQLite** via built-in `node:sqlite` (prototype persistence)

## Persistence note (MySQL later)

This prototype uses **SQLite** (Node.js built-in `node:sqlite`) so it runs without a MySQL daemon in local/dev VMs. The table shapes (`sections`, `items`, `notes` with TEXT ids and ISO timestamps) are intentionally simple to port to **MySQL/MariaDB** for production (project decision D1). No Redis/Docker/K8s required.

## How to run locally / اجرای محلی

پیش‌نیاز: Node.js ≥ 20 و `pnpm`.

```bash
pnpm install
pnpm dev
```

- وب: [http://localhost:5173](http://localhost:5173) (پروکسی Vite به API روی `/api`)
- API مستقیم: [http://localhost:3001/api/health](http://localhost:3001/api/health)

اسکریپت‌های جدا:

```bash
pnpm dev:api
pnpm dev:web
```

### جریان کار پروتوتایپ

1. در اولین بازدید، **یوزرنیم** (نام نمایشی) را وارد کنید — در `localStorage` ذخیره می‌شود.
2. بخش‌های مستند را باز کنید و روی آیتم‌ها یادداشت بگذارید؛ همه کاربران یادداشت‌های یکدیگر را می‌بینند (ذخیره روی سرور).
3. دکمه **دانلود بسته برای هوش مصنوعی** فایل‌های `aspina-notes-export.md` و `aspina-notes-export.json` را دانلود می‌کند (عنوان بخش‌ها، یادداشت‌ها با نویسنده و زمان، و دستورالعمل کوتاه برای عامل کدنویسی).

### محدودیت‌های این مایلستون

- بدون احراز هویت واقعی / رمز عبور
- بدون همگام‌سازی آفلاین، جلسات، یا آداپتر AI
- نام نمایشی فقط سمت کلاینت؛ همراه هر یادداشت به سرور فرستاده می‌شود
