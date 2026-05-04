#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const HOME = os.homedir();
const WIKI_LOG = path.join(HOME, 'wiki', 'wiki', 'log.md');
const WIKI_DIR = path.join(HOME, 'wiki', 'wiki');

const PROJECTS = [
  path.join(HOME, 'career-ops'),
  path.join('C:\\', 'career-ops'),
  path.join(HOME, 'wiki'),
  path.join(HOME, 'hiring-agent'),
  path.join(HOME, 'GHIC'),
  path.join(HOME, 'everything-claude-code'),
  path.join(HOME, 'claude-wiki-system'),
];

const WATCH_DIRS = [
  path.join(HOME, 'Documents', 'Claude'),
  path.join(HOME, 'Downloads'),
  path.join(HOME, 'Desktop'),
];

function today() { return new Date().toISOString().slice(0, 10); }
function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Scan a directory recursively for files modified today
function getModifiedFiles(dir, depth = 0) {
  if (depth > 3) return [];
  if (!fs.existsSync(dir)) return [];
  const todayMs = getTodayMidnight();
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const full = path.join(dir, entry);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results.push(...getModifiedFiles(full, depth + 1));
        } else if (stat.mtimeMs >= todayMs) {
          results.push(path.relative(HOME, full));
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

function getGitActivity() {
  const commits = [];
  for (const project of PROJECTS) {
    if (!fs.existsSync(path.join(project, '.git'))) continue;
    try {
      const log = execSync(
        `git -C "${project}" log --since="midnight" --oneline --no-merges`,
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      if (log) {
        const name = path.basename(project);
        log.split('\n').filter(Boolean).forEach(l => commits.push(`[${name}] ${l.trim()}`));
      }
    } catch { /* skip */ }
  }
  return commits;
}

function getLinkedInActivity() {
  const liDir = path.join(HOME, 'Documents', 'Claude', 'Projects', 'LinkedIn Marketing');
  if (!fs.existsSync(liDir)) return [];
  const todayMs = getTodayMidnight();
  return fs.readdirSync(liDir)
    .filter(f => f.endsWith('.txt') && fs.statSync(path.join(liDir, f)).mtimeMs >= todayMs)
    .map(f => `LinkedIn post saved: ${f.replace('.txt', '')}`);
}

function getClaudeDesktopActivity() {
  const logPath = path.join(HOME, '.claude', 'logs', 'main.log');
  const raw = readFileSafe(logPath);
  const todayStr = today();
  const lines = raw.split('\n').filter(l => l.includes(todayStr));
  const activity = [];
  if (lines.filter(l => l.includes('Starting app')).length > 0)
    activity.push(`Claude Desktop launched ${lines.filter(l => l.includes('Starting app')).length} time(s)`);
  if (lines.filter(l => l.includes('[error]')).length > 0)
    activity.push(`${lines.filter(l => l.includes('[error]')).length} error(s) in Claude Desktop`);
  return activity;
}


// -- Manual notes from today-notes.txt --
function getManualNotes() {
  const notesPath = path.join(HOME, 'wiki', 'today-notes.txt');
  if (!fs.existsSync(notesPath)) return [];
  const content = readFileSafe(notesPath).trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean);
}

function archiveAndClearNotes(notes) {
  const notesPath = path.join(HOME, 'wiki', 'today-notes.txt');
  const archiveDir = path.join(WIKI_DIR, 'notes');
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
  const archivePath = path.join(archiveDir, `${today()}.md`);
  fs.writeFileSync(archivePath, `# Notes ${today()}\n\n${notes.join('\n')}\n`, 'utf8');
  fs.writeFileSync(notesPath, '', 'utf8');
  console.log(`Archived notes to notes/${today()}.md and cleared today-notes.txt`);
}
function buildLogEntry() {
  const dt = today();
  const sections = [];

  const manualNotes = getManualNotes();
  if (manualNotes.length > 0)
    sections.push(`**Today'\''s notes**\n${manualNotes.map(l => `- ${l}`).join('\n')}`);

  const claudeActivity = getClaudeDesktopActivity();
  if (claudeActivity.length > 0)
    sections.push(`**Claude Desktop**\n${claudeActivity.map(l => `- ${l}`).join('\n')}`);

  const gitCommits = getGitActivity();
  if (gitCommits.length > 0)
    sections.push(`**Git commits**\n${gitCommits.map(l => `- ${l}`).join('\n')}`);

  const linkedIn = getLinkedInActivity();
  if (linkedIn.length > 0)
    sections.push(`**LinkedIn content**\n${linkedIn.map(l => `- ${l}`).join('\n')}`);

  // Modified files across project dirs
  const allModified = [];
  for (const proj of PROJECTS) allModified.push(...getModifiedFiles(proj));
  for (const dir of WATCH_DIRS) allModified.push(...getModifiedFiles(dir));
  const unique = [...new Set(allModified)].slice(0, 20);
  if (unique.length > 0)
    sections.push(`**Files modified today**\n${unique.map(l => `- ${l}`).join('\n')}`);

  if (sections.length === 0) sections.push('No file activity detected. Sessions likely in claude.ai browser.');

  return `\n---\n\n## [${dt}] daily-log | End of day summary\n\n${sections.join('\n\n')}\n`;
}

function appendToWiki(entry) {
  if (!fs.existsSync(WIKI_LOG)) { console.error(`Wiki log not found: ${WIKI_LOG}`); process.exit(1); }
  const existing = readFileSafe(WIKI_LOG);
  const marker = `## [${today()}] daily-log`;
  if (existing.includes(marker)) { console.log(`Entry for ${today()} already exists. Skipping.`); return false; }
  fs.appendFileSync(WIKI_LOG, entry, 'utf8');
  console.log(`Done: appended daily log for ${today()}`);
  return true;
}

function updateIndex() {
  const indexPath = path.join(WIKI_DIR, 'index.md');
  const existing = readFileSafe(indexPath);
  const marker = `daily-log-${today()}`;
  if (existing.includes(marker)) return;
  fs.appendFileSync(indexPath, `- [Daily log ${today()}](log.md) <!-- ${marker} -->\n`, 'utf8');
}

console.log(`\nWiki Daily Logger - ${today()}`);
console.log('-'.repeat(40));
const entry = buildLogEntry();
console.log(entry);
const appended = appendToWiki(entry);
if (appended) updateIndex();
const notes = getManualNotes();
if (notes.length > 0) archiveAndClearNotes(notes);


