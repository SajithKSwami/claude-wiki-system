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
├── CLAUDE.md               ← wiki operating manual for Claude Code
└── wiki/
    ├── index.md            ← catalog of all pages
    ├── log.md              ← append-only activity log (auto-updated nightly)
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

### Step 1 — Clone this repo

```powershell
cd "C:\Users\$env:USERNAME"
git clone https://github.com/SajithKSwami/claude-wiki-system.git
cd claude-wiki-system
```

### Step 2 — Create the wiki folder structure

```powershell
New-Item -ItemType Directory -Force -Path "wiki\wiki\concepts"
New-Item -ItemType Directory -Force -Path "wiki\wiki\entities"
New-Item -ItemType Directory -Force -Path "wiki\wiki\sources"
New-Item -ItemType Directory -Force -Path "wiki\raw\assets"
```

### Step 3 — Create the core wiki files

Create `wiki\wiki\log.md`:
```markdown
---
title: "Activity Log"
updated: 2026-01-01
---

# Activity Log

Append-only log of all wiki operations and daily Claude activity.
```

Create `wiki\wiki\index.md`:
```markdown
---
title: "Wiki Index"
updated: 2026-01-01
---

# Wiki Index

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

Create `wiki\wiki\overview.md`:
```markdown
---
title: "Overview"
updated: 2026-01-01
---

# Overview

High-level synthesis of everything in this wiki. Update as themes emerge.
```

### Step 4 — Edit the logger to match your folders

Open `daily-logger.mjs` and update the `PROJECTS` array with your actual project folder names:

```js
const PROJECTS = [
  path.join(HOME, 'my-project-1'),
  path.join(HOME, 'my-project-2'),
  path.join(HOME, 'my-project-3'),
];
```

Also update the LinkedIn path if you use a different folder:

```js
const liDir = path.join(HOME, 'Documents', 'Claude', 'Projects', 'LinkedIn Marketing');
```

### Step 5 — Test the logger

```powershell
node daily-logger.mjs
```

Expected output:
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
Get-Content "wiki\wiki\log.md" | Select-Object -Last 20
```

### Step 6 — Register the scheduled task (Windows)

```powershell
$TaskName = "Claude-Wiki-Daily-Logger"
$ScriptPath = "$PWD\daily-logger.mjs"
$NodePath = "C:\Program Files\nodejs\node.exe"
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument $ScriptPath -WorkingDirectory $PWD.Path
$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"
$Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -StartWhenAvailable -DontStopIfGoingOnBatteries -RunOnlyIfNetworkAvailable:$false
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Appends Claude daily activity to wiki/log.md at 11 PM" -RunLevel Limited
```

Verify:
```powershell
Get-ScheduledTask -TaskName "Claude-Wiki-Daily-Logger"
```

State should show `Ready`.

### Step 7 — Set up Obsidian

1. Download and install [Obsidian](https://obsidian.md) (free)
2. Launch Obsidian → **Open folder as vault**
3. Select the `wiki\wiki` folder inside this repo
4. Click **Select Folder**

The `.obsidian` config in this repo pre-configures reading mode, relative links, graph view, and core plugins automatically.

**Key shortcuts:**

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Quick switch to any page |
| `Ctrl+Shift+F` | Full text search across all pages |
| `Ctrl+Shift+G` | Graph view — see how concepts connect |

---

## Connecting Claude Code to your projects

Add the filesystem MCP to give Claude Code access to all your project folders. Close Claude Desktop first, then run:

```powershell
$json = Get-Content "$env:USERPROFILE\.claude.json" | ConvertFrom-Json
$json | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{
    "filesystem" = @{
        "command" = "C:\Program Files\nodejs\npx.cmd"
        "args" = @("-y", "@modelcontextprotocol/server-filesystem", "C:\Users\$env:USERNAME\project-1", "C:\Users\$env:USERNAME\project-2", "C:\Users\$env:USERNAME\wiki")
        "description" = "Filesystem access to all projects"
    }
} -Force
$json | ConvertTo-Json -Depth 20 | Set-Content "$env:USERPROFILE\.claude.json"
```

Restart Claude Code, then type `/mcp` to confirm `filesystem · connected`.

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
- [wiki] docs: ingest ontario hiring playbook

**LinkedIn content**
- LinkedIn post saved: Day_16
- LinkedIn post saved: Day_17

**Claude observations**
- career-ops: portal scan config refined for reliability
```

---

## Mac / Linux

The logger script works unchanged on Mac and Linux. Replace the scheduler step with a cron job:

```bash
# Open crontab
crontab -e

# Add this line — runs at 11 PM daily
0 23 * * * /usr/local/bin/node /Users/YOUR_USERNAME/wiki/daily-logger.mjs >> /Users/YOUR_USERNAME/wiki/daily-logger.log 2>&1
```

---

## Troubleshooting

**"No activity recorded today"**
Normal on first run or quiet days. Fills in automatically after a full day of Claude activity.

**Scheduled task not running**
Open Task Scheduler → find `Claude-Wiki-Daily-Logger` → right-click → Run to test manually.

**filesystem MCP shows "failed"**
Run `where.exe npx` in PowerShell and use the full path shown under `C:\Program Files\nodejs\`.

**Obsidian shows broken links**
Make sure you opened `wiki\wiki` as the vault root, not the parent `wiki` folder.

**git push says "Permission denied"**
Run `git remote set-url origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/claude-wiki-system.git` then push again using a Personal Access Token as the password.

---

## Files in this repo

| File | Purpose |
|------|---------|
| `daily-logger.mjs` | Main logger — copy to your wiki root |
| `setup-scheduler.ps1` | Windows Task Scheduler registration |
| `wiki/CLAUDE.md` | Operating manual for Claude Code in wiki sessions |
| `wiki/wiki/.obsidian/` | Pre-configured Obsidian settings |
| `README.md` | This guide |

---

## Contributing

If you extend the logger to capture new sources — Notion, GitHub issues, email, Slack — PRs are welcome.

---

## License

MIT — use freely, attribution appreciated.

---

*Built during a Claude Desktop crash recovery session, May 2026.*  
*Sometimes the best systems get built when the old ones break.*
