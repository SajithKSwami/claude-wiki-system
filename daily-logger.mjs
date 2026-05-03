#!/usr/bin/env node
/**
 * daily-logger.mjs
 * Reads today's Claude Code session logs + file-history,
 * summarises what was done, and appends a structured entry
 * to wiki/wiki/log.md in the exact format the wiki expects.
 *
 * Run manually:  node daily-logger.mjs
 * Run on schedule: Task Scheduler calls this at 11:00 PM daily
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// ── Config ────────────────────────────────────────────────────────────────────
const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const WIKI_LOG = path.join(HOME, 'wiki', 'wiki', 'log.md');
const WIKI_DIR = path.join(HOME, 'wiki', 'wiki');

const PROJECTS = [
  path.join(HOME, 'career-ops'),
  path.join(HOME, 'wiki'),
  path.join(HOME, 'hiring-agent'),
  path.join(HOME, 'GHIC'),
  path.join(HOME, 'everything-claude-code'),
  path.join(HOME, 'Downloads'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

// ── Collect activity from Claude logs ─────────────────────────────────────────
function getMainLogActivity() {
  const logPath = path.join(CLAUDE_DIR, 'logs', 'main.log');
  const raw = readFileSafe(logPath);
  const todayStr = today();
  const lines = raw.split('\n').filter(l => l.includes(todayStr));

  const activity = [];
  const sessionStarts = lines.filter(l => l.includes('Starting app'));
  if (sessionStarts.length > 0) {
    activity.push(`Claude Desktop/Code launched ${sessionStarts.length} time(s)`);
  }
  const errors = lines.filter(l => l.includes('[error]'));
  if (errors.length > 0) {
    activity.push(`${errors.length} error(s) logged`);
  }
  return activity;
}

// ── Collect file edits from file-history ──────────────────────────────────────
function getFileHistoryActivity() {
  const histDir = path.join(CLAUDE_DIR, 'file-history');
  if (!fs.existsSync(histDir)) return [];

  const sessions = fs.readdirSync(histDir);
  const todayMidnight = new Date(today()).getTime();
  const edited = new Set();

  for (const session of sessions) {
    const sessionDir = path.join(histDir, session);
    if (!fs.statSync(sessionDir).isDirectory()) continue;

    const files = fs.readdirSync(sessionDir);
    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs >= todayMidnight) {
        const content = readFileSafe(filePath);
        const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim();
        if (firstLine) edited.add(firstLine.slice(0, 80));
      }
    }
  }
  return [...edited];
}

// ── Collect git activity across projects ──────────────────────────────────────
function getGitActivity() {
  const commits = [];
  for (const project of PROJECTS) {
    const gitDir = path.join(project, '.git');
    if (!fs.existsSync(gitDir)) continue;
    try {
      const log = execSync(
        `git -C "${project}" log --since="midnight" --oneline --no-merges`,
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      if (log) {
        const projectName = path.basename(project);
        log.split('\n').forEach(line => {
          if (line.trim()) commits.push(`[${projectName}] ${line.trim()}`);
        });
      }
    } catch { /* skip */ }
  }
  return commits;
}

// ── Collect observations from homunculus ─────────────────────────────────────
function getObservations() {
  const hDir = path.join(CLAUDE_DIR, 'homunculus', 'projects');
  if (!fs.existsSync(hDir)) return [];

  const notes = [];
  const todayMidnight = new Date(today()).getTime();

  for (const proj of fs.readdirSync(hDir)) {
    const obsPath = path.join(hDir, proj, 'observations.jsonl');
    if (!fs.existsSync(obsPath)) continue;
    if (fs.statSync(obsPath).mtimeMs < todayMidnight) continue;

    const lines = readFileSafe(obsPath).split('\n').filter(Boolean);
    const todayObs = lines
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(o => o && o.timestamp && new Date(o.timestamp).getTime() >= todayMidnight)
      .map(o => o.observation || o.content || '')
      .filter(Boolean)
      .slice(0, 5);
    notes.push(...todayObs);
  }
  return notes;
}

// ── Collect LinkedIn posts saved today ───────────────────────────────────────
function getLinkedInActivity() {
  const liDir = path.join(HOME, 'Documents', 'Claude', 'Projects', 'LinkedIn Marketing');
  if (!fs.existsSync(liDir)) return [];

  const todayMidnight = new Date(today()).getTime();
  return fs.readdirSync(liDir)
    .filter(f => f.endsWith('.txt'))
    .filter(f => fs.statSync(path.join(liDir, f)).mtimeMs >= todayMidnight)
    .map(f => `LinkedIn post saved: ${f.replace('.txt', '')}`);
}

// ── Build the log entry ───────────────────────────────────────────────────────
function buildLogEntry() {
  const dt = today();
  const sections = [];

  const logActivity = getMainLogActivity();
  const fileEdits = getFileHistoryActivity();
  const gitCommits = getGitActivity();
  const observations = getObservations();
  const linkedIn = getLinkedInActivity();

  if (logActivity.length > 0) {
    sections.push(`**Session**\n${logActivity.map(l => `- ${l}`).join('\n')}`);
  }
  if (fileEdits.length > 0) {
    sections.push(`**Files edited via Claude**\n${fileEdits.map(l => `- ${l}`).join('\n')}`);
  }
  if (gitCommits.length > 0) {
    sections.push(`**Git commits**\n${gitCommits.map(l => `- ${l}`).join('\n')}`);
  }
  if (linkedIn.length > 0) {
    sections.push(`**LinkedIn content**\n${linkedIn.map(l => `- ${l}`).join('\n')}`);
  }
  if (observations.length > 0) {
    sections.push(`**Claude observations**\n${observations.map(l => `- ${l}`).join('\n')}`);
  }
  if (sections.length === 0) {
    sections.push('No activity recorded today.');
  }

  return `\n---\n\n## [${dt}] daily-log | End of day summary\n\n${sections.join('\n\n')}\n`;
}

// ── Append to wiki/log.md ─────────────────────────────────────────────────────
function appendToWiki(entry) {
  if (!fs.existsSync(WIKI_LOG)) {
    console.error(`Wiki log not found at: ${WIKI_LOG}`);
    process.exit(1);
  }

  const existing = readFileSafe(WIKI_LOG);
  const todayMarker = `## [${today()}] daily-log`;
  if (existing.includes(todayMarker)) {
    console.log(`Entry for ${today()} already exists. Skipping.`);
    return false;
  }

  fs.appendFileSync(WIKI_LOG, entry, 'utf8');
  console.log(`✓ Appended daily log entry for ${today()} to wiki/log.md`);
  return true;
}

// ── Update wiki/index.md ──────────────────────────────────────────────────────
function updateIndex() {
  const indexPath = path.join(WIKI_DIR, 'index.md');
  const existing = readFileSafe(indexPath);
  const todayStr = today();
  const marker = `daily-log-${todayStr}`;
  if (existing.includes(marker)) return;

  const newLine = `- [Daily log ${todayStr}](log.md) <!-- daily-log-${todayStr} -->\n`;
  fs.appendFileSync(indexPath, newLine, 'utf8');
  console.log('✓ Index updated');
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\nWiki Daily Logger — ${today()}`);
console.log('─'.repeat(40));

const entry = buildLogEntry();
console.log('\nEntry preview:');
console.log(entry);

const appended = appendToWiki(entry);
if (appended) updateIndex();

console.log('\nDone.');
