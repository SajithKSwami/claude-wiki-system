# Claude Wiki System

A self-maintaining knowledge base that automatically logs everything you do in Claude Code every day — zero manual effort after setup.

Built by [Sajithkumar Swaminathan](https://linkedin.com/in/sajithkumars) | Toronto, Canada

---

## What this is

Every night at 11 PM, a script scans your Claude activity and appends a structured entry to a wiki log. Over time, you build a searchable, cross-linked knowledge base of everything Claude helped you create, edit, and ship — organised by project, concept, and entity.

The wiki opens in Obsidian as a fully navigable knowledge graph.

```
wiki/
├── daily-logger.mjs        ← runs nightly, appends to log
├── setup-scheduler.ps1     ← registers the Windows scheduled task
└── wiki/
    ├── index.md            ← catalog of all pages
    ├── log.md              ← append-only activity log (auto-updated)
    ├── overview.md         ← high-level synthesis
    ├── concepts/           ← ideas, frameworks, techniques
    ├── entities/           ← people, companies, tools
    └── sources/            ← one page per ingested source
```

---

## What gets logged automatically

| Source | What it captures |
|--------|-----------------|
| `.claude/logs/main.log` | Claude sessions started, errors |
| `.claude/file-history/` | Files edited via Claude Code |
| Git repos | Commits across all your project folders |
| `.claude/homunculus/` | Claude's own observations about your work |
| LinkedIn Marketing folder | Posts saved to your content folder |

---

## Prerequisites

- Windows 10/11
- [Node.js](https://nodejs.org) v18 or later
- [Claude Code](https://claude.ai/code) installed and authenticated
- [Obsidian](https://obsidian.md) (free) for viewing the wiki

Check Node is installed:
```powershell
node --version
```

---

## Setup (15 minutes)

### Step 1 — Create the wiki folder structure

Open PowerShell and run:

```powershell
# Set your wiki location
$WIKI = "C:\Users\$env:USERNAME\wiki"

# Create folder structure
New-Item -ItemType Directory -Force -Path "$WIKI\wiki\concepts"
New-Item -ItemType Directory -Force -Path "$WIKI\wiki\entities"
New-Item -ItemType Directory -Force -Path "$WIKI\wiki\sources"
New-Item -ItemType Directory -Force -Path "$WIKI\raw\assets"
New-Item -ItemType Directory -Force -Path "$WIKI\wiki\.obsidian"

Write-Host "✓ Folder structure created at $WIKI"
```

### Step 2 — Create the core wiki files

**`wiki/wiki/log.md`** — the append-only activity log:

```markdown
---
title: "Activity Log"
updated: 2026-01-01
---

# Activity Log

Append-only log of all wiki operations and daily Claude activity.
```

**`wiki/wiki/index.md`** — the catalog:

```markdown
---
title: "Wiki Index"
updated: 2026-01-01
---

# Wiki Index

Catalog of all pages. Updated after every ingest or daily log.

## Overview
| Page | Summary |
|------|---------|
| [overview.md](overview.md) | High-level synthesis |

## Sources
| Page | Date | Summary |
|------|------|---------|

## Entities
| Page | Tags | Summary |
|------|------|---------|

## Concepts
| Page | Tags | Status | Summary |
|------|------|--------|---------|
```

**`wiki/wiki/overview.md`** — high-level synthesis (fill this in as your wiki grows):

```markdown
---
title: "Overview"
updated: 2026-01-01
---

# Overview

High-level synthesis of everything in this wiki. Update as themes emerge.
```

**`wiki/CLAUDE.md`** — instructions for Claude Code when working in this folder:

```markdown
# Wiki — Operating Manual

This is a persistent knowledge base maintained by Claude.

## Directory Layout
wiki/
├── CLAUDE.md           ← this file
├── raw/                ← source documents (read only)
└── wiki/               ← maintained pages
    ├── index.md        ← always update after changes
    ├── log.md          ← append-only activity log
    ├── overview.md     ← high-level synthesis
    ├── entities/       ← people, companies, tools
    ├── concepts/       ← ideas, frameworks, techniques
    └── sources/        ← one page per source

## Rules
1. NEVER modify files in raw/ — read only
2. ALWAYS update index.md and log.md after any change
3. ALWAYS add frontmatter to every new page
4. NEVER silently delete contradictory claims — flag them
```

### Step 3 — Install the daily logger

Download `daily-logger.mjs` from this repo and copy it to your wiki folder:

```powershell
Copy-Item "daily-logger.mjs" "C:\Users\$env:USERNAME\wiki\daily-logger.mjs"
```

Or write it directly (see [daily-logger.mjs](daily-logger.mjs) in this repo).

**Edit the PROJECTS array** in `daily-logger.mjs` to match your folder names:

```js
const PROJECTS = [
  path.join(HOME, 'my-project-1'),
  path.join(HOME, 'my-project-2'),
  path.join(HOME, 'my-project-3'),
];
```

Also update the LinkedIn path if you save posts somewhere different:

```js
// Around line 110 in daily-logger.mjs
const liDir = path.join(HOME, 'Documents', 'Claude', 'Projects', 'LinkedIn Marketing');
```

### Step 4 — Test the logger

```powershell
node "C:\Users\$env:USERNAME\wiki\daily-logger.mjs"
```

You should see:

```
Wiki Daily Logger — 2026-05-03
----------------------------------------
Entry preview:

---

## [2026-05-03] daily-log | End of day summary

No activity recorded today.

✓ Appended daily log entry for 2026-05-03 to wiki/log.md
✓ Index updated

Done.
```

Check the log was written:

```powershell
Get-Content "C:\Users\$env:USERNAME\wiki\wiki\log.md" | Select-Object -Last 20
```

### Step 5 — Register the scheduled task

Run this in PowerShell to register a task that runs every night at 11 PM:

```powershell
$TaskName = "Claude-Wiki-Daily-Logger"
$ScriptPath = "C:\Users\$env:USERNAME\wiki\daily-logger.mjs"
$NodePath = "C:\Program Files\nodejs\node.exe"

$Action = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument $ScriptPath `
    -WorkingDirectory "C:\Users\$env:USERNAME\wiki"

$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -RunOnlyIfNetworkAvailable:$false

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Appends Claude daily activity to wiki/log.md at 11 PM" `
    -RunLevel Limited
```

Verify it registered:

```powershell
Get-ScheduledTask -TaskName "Claude-Wiki-Daily-Logger"
```

You should see `State: Ready`.

### Step 6 — Set up Obsidian

1. Download and install [Obsidian](https://obsidian.md) (free)
2. Launch Obsidian
3. Click **Open folder as vault**
4. Select `C:\Users\YOUR_USERNAME\wiki\wiki`
5. Click **Select Folder**

Copy the `.obsidian` config folder from this repo into `wiki/wiki/.obsidian/` to get the pre-configured settings (reading mode on open, relative links, graph view enabled).

**Key shortcuts once open:**

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Quick switch to any page |
| `Ctrl+Shift+F` | Full text search |
| `Ctrl+Shift+G` | Graph view — see how concepts connect |
| `Ctrl+Shift+V` | Toggle preview/edit |

---

## Daily workflow

You don't need to do anything. At 11 PM, the logger runs and appends to `log.md`.

If you want to **manually ingest a source** (article, book, LinkedIn post), open Claude Code in your wiki folder and say:

```
Ingest this source: [paste content or drop file into raw/]
```

Claude Code will follow the `CLAUDE.md` instructions and create a source page, update entity and concept pages, and update `index.md` and `log.md` automatically.

---

## What a daily log entry looks like

After a full day of work:

```markdown
---

## [2026-05-03] daily-log | End of day summary

**Session**
- Claude Desktop/Code launched 3 time(s)

**Files edited via Claude**
- Portal Scanner Configuration
- career-ops pipeline tracker

**Git commits**
- [career-ops] feat: add kinectrics portal scanner
- [career-ops] fix: dedup tracker edge case
- [wiki] docs: ingest ontario hiring playbook

**LinkedIn content**
- LinkedIn post saved: Day_16
- LinkedIn post saved: Day_17

**Claude observations**
- career-ops: portal scan config refined for reliability
```

---

## Connecting Claude Code to your projects

To give Claude Code filesystem access to all your projects, add this to `~/.claude.json`:

```powershell
$json = Get-Content "$env:USERPROFILE\.claude.json" | ConvertFrom-Json
$json | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{
    "filesystem" = @{
        "command" = "C:\Program Files\nodejs\npx.cmd"
        "args" = @(
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "C:\Users\$env:USERNAME\project-1",
            "C:\Users\$env:USERNAME\project-2",
            "C:\Users\$env:USERNAME\wiki"
        )
        "description" = "Filesystem access to all projects"
    }
} -Force
$json | ConvertTo-Json -Depth 20 | Set-Content "$env:USERPROFILE\.claude.json"
```

Restart Claude Code, then type `/mcp` to confirm `filesystem · connected`.

---

## Troubleshooting

**Logger shows "No activity recorded today"**
This is normal on first run or on days with no Claude activity. It will fill in automatically once you use Claude Code.

**Scheduled task not running**
Check Task Scheduler → Task Scheduler Library → `Claude-Wiki-Daily-Logger`. Right-click → Run to test manually.

**filesystem MCP shows "failed"**
npx path may differ on your system. Run `where.exe npx` and use the full path that appears under `C:\Program Files\nodejs\`.

**Obsidian shows broken links**
Make sure you opened `wiki/wiki` as the vault root, not the parent `wiki` folder.

---

## Mac/Linux users

The logger script works on Mac and Linux with no changes. Replace the scheduler step with a cron job:

```bash
# Run at 11 PM daily
0 23 * * * /usr/local/bin/node /Users/YOUR_USERNAME/wiki/daily-logger.mjs >> /Users/YOUR_USERNAME/wiki/daily-logger.log 2>&1
```

Add with `crontab -e`.

---

## Files in this repo

| File | Purpose |
|------|---------|
| `daily-logger.mjs` | Main logger script — copy to your wiki folder |
| `setup-scheduler.ps1` | Windows Task Scheduler registration |
| `wiki/CLAUDE.md` | Wiki operating manual for Claude Code |
| `wiki/wiki/.obsidian/` | Pre-configured Obsidian settings |
| `README.md` | This guide |

---

## Contributing

If you extend the logger to capture new sources — Notion, GitHub issues, email, calendar — PRs are welcome.

---

## License

MIT — use freely, attribution appreciated.

---

*Built during a Claude Desktop crash recovery session, May 2026.*
*Sometimes the best systems get built when the old ones break.*
