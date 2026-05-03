# General Learning Wiki — Operating Manual

This is a persistent, compounding knowledge base maintained by Claude.
The human curates sources and asks questions. Claude does all the writing, cross-referencing, and maintenance.

## Directory Layout

```
wiki/
├── CLAUDE.md           ← this file (schema + conventions)
├── raw/                ← immutable source documents (human adds; LLM reads only)
│   └── assets/         ← locally downloaded images
└── wiki/               ← LLM-maintained markdown pages
    ├── index.md        ← catalog of all wiki pages (always update after ingest)
    ├── log.md          ← append-only activity log (always update after any operation)
    ├── overview.md     ← high-level synthesis of everything in the wiki
    ├── entities/       ← people, companies, products, tools, models
    ├── concepts/       ← ideas, techniques, frameworks, terms
    └── sources/        ← one summary page per ingested source
```

## Page Conventions

### Frontmatter (all wiki pages must have this)
```yaml
---
title: "Page Title"
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [source-slug-1, source-slug-2]
---
```

### File naming
- Lowercase, hyphens, no spaces: `attention-mechanism.md`, `andrej-karpathy.md`
- Source pages: `sources/YYYY-MM-DD-slug.md`
- Entities: `entities/name-or-product.md`
- Concepts: `concepts/concept-name.md`

### Internal links
Always use relative markdown links: `[Attention](../concepts/attention-mechanism.md)`
Every new entity or concept mentioned in a page should be linked — create the target page if it doesn't exist yet (stub it with a one-liner and TODO note).

### Contradictions
When new sources contradict existing claims, add a `> **Conflict (YYYY-MM-DD):** ...` blockquote on the affected page and note both views. Don't silently overwrite.

### Stubs
Pages created as placeholders get a `status: stub` frontmatter field and a single sentence. Fill them in when relevant sources arrive.

## Workflows

### Ingest (human drops a source into raw/ or pastes content)
1. Read the source fully
2. Discuss key takeaways with the human (ask if ambiguous)
3. Write `wiki/sources/YYYY-MM-DD-slug.md` — full summary with key claims, quotes, metadata
4. Create or update entity pages for all people, companies, tools, models mentioned
5. Create or update concept pages for all ideas, techniques, frameworks mentioned
6. Update `wiki/overview.md` if the source shifts the overall picture
7. Update `wiki/index.md` — add the new source page and any new entity/concept pages
8. Append to `wiki/log.md`: `## [YYYY-MM-DD] ingest | Source Title`

### Query (human asks a question)
1. Read `wiki/index.md` to find relevant pages
2. Read those pages
3. Synthesize answer with citations (link to wiki pages, not raw sources)
4. If the answer is valuable and reusable, offer to file it back as a new wiki page
5. Append to `wiki/log.md`: `## [YYYY-MM-DD] query | Question summary`

### Lint (human asks for a health check)
Check for:
- Contradictions between pages not yet flagged
- Stale claims newer sources have superseded
- Orphan pages (no inbound links)
- Important concepts mentioned but lacking their own page
- Missing cross-references between related pages
- Data gaps that could be filled with a web search
Produce a lint report and suggest next sources to investigate.
Append to `wiki/log.md`: `## [YYYY-MM-DD] lint | summary`

### Add to wiki (human asks to file a query answer)
1. Write the page to the appropriate directory
2. Update index.md
3. Back-link from relevant existing pages
4. Append to log.md

## Topics of Interest (update as the wiki grows)

The human's current learning interests (edit this section as themes emerge):
- AI / LLMs / machine learning
- Recruiting technology and TA ops
- Career strategy and negotiation
- Productivity and knowledge management
- Business / startups / venture capital

## Scale Notes

- At <50 pages: index.md is sufficient for navigation; no search tooling needed
- At 50-200 pages: consider building a simple grep-based search script
- At 200+ pages: evaluate qmd (https://github.com/tobi/qmd) for hybrid BM25/vector search

## Rules

1. NEVER modify files in `raw/` — read only
2. ALWAYS update `index.md` and `log.md` after any ingest, query-filing, or structural change
3. ALWAYS add frontmatter to every new wiki page
4. NEVER silently delete or overwrite contradictory claims — flag them
5. Stubs are fine; missing cross-references are not
6. When uncertain about where to file something, ask
