# Wiki — Operating Manual

This is a persistent knowledge base maintained by Claude.

## Directory Layout
```
wiki/
├── CLAUDE.md
├── raw/                ← source documents (read only)
└── wiki/
    ├── index.md        ← always update after changes
    ├── log.md          ← append-only activity log
    ├── overview.md     ← high-level synthesis
    ├── entities/
    ├── concepts/
    └── sources/
```

## Rules
1. NEVER modify files in raw/ — read only
2. ALWAYS update index.md and log.md after any change
3. ALWAYS add frontmatter to every new page
4. NEVER silently delete contradictory claims — flag them
5. Stubs are fine; missing cross-references are not
