# odot

A local-first, privacy-focused personal task manager. Your data stays on your device and syncs end-to-end encrypted across devices.

## Features

**Task Management**
- Create, edit, and organize todos with notes and checklists
- Schedule tasks with dates, deadlines, and recurrence rules
- Drag-and-drop reordering across all views

**Organization**
- **Projects** with custom colors and progress tracking
- **Areas** to group related projects
- **Tags** for cross-cutting categorization
- Hierarchical sidebar with drag-and-drop

**Views**
- Inbox, Today, Anytime, Upcoming, Someday, Logbook, Trash
- Per-project and per-tag filtered views

**Keyboard-Driven Workflow**
- `j`/`k` or Arrow keys to navigate
- `Enter` to expand, `Space` to complete
- `n` new todo, `d` schedule, `l` deadline, `p` project, `t` tag
- `1`-`5` quick view switching
- `Cmd+K` / `Ctrl+K` command palette with natural language input

**Command Palette**
- Create todos with quick syntax: `Buy milk @shopping #errands !today ^friday`
- Search todos, projects, tags, and views
- Autocomplete for `@projects`, `#tags`, `!schedule`, `^deadline`

**Local-First & Privacy**
- All data stored locally using [Evolu](https://www.evolu.dev)
- End-to-end encrypted sync across devices
- Works offline as a PWA
- Self-hostable sync server
- Data export/import as JSON

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19, TypeScript 5.9 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Database | Evolu (local-first SQLite with CRDT sync) |
| UI Primitives | Radix UI, cmdk |
| Icons | Lucide React |
| Drag & Drop | dnd-kit |
| Dates | date-fns, rrule |
| PWA | vite-plugin-pwa, Workbox |

## Getting Started

### Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Build

```bash
npm run build
npm run preview
```

### Docker

```bash
docker build -t odot .
docker run -p 3000:80 odot
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full deployment guide including self-hosted sync, Docker Compose, Portainer, and CI/CD.

## Project Structure

```
src/
  components/
    layout/       Sidebar, AppShell, MainContent
    shared/       Command palette, pickers, dialogs
    todo/         TodoList, TodoRow, TodoDetail, ChecklistEditor
    ui/           Base components (Button, Dialog, Calendar, ...)
  db/
    schema.ts     Database table definitions
    queries.ts    Pre-built queries for all tables
    evolu.ts      Evolu instance and configuration
  hooks/          Action hooks (useTodoActions, useProjectActions, ...)
  lib/            Utility functions (filters, date helpers, export/import)
  views/          View components (Inbox, Today, Project, ...)
```

## License

All rights reserved.
