# RepoBrief Launch Plan

Repo: https://github.com/fadythebassist/repobrief

RepoBrief is public on GitHub. This plan focuses on getting the first real users, stars, feedback, and eventual monetization.

> Important npm note: the unscoped npm package name `repobrief` is already taken. Do **not** advertise `npx repobrief` until package ownership/name is resolved. Use GitHub clone instructions for launch, or publish later as a scoped package such as `@fadythebassist/repobrief`.

## Positioning

### One-line pitch

**RepoBrief keeps AI coding agents aligned with your repo.**

### Stronger launch hook

Your `CLAUDE.md` / Cursor rules / Copilot instructions are probably already stale. RepoBrief scans your repo, writes the agent context files, and tells you when they drift.

### What it does

RepoBrief generates and maintains:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/project.mdc`
- `.github/copilot-instructions.md`
- `.agent-context/facts.json`
- `.agent-context/repo-map.md`

It detects:

- package manager
- languages/frameworks
- important folders
- test/lint/typecheck/build commands
- existing agent docs
- context drift after repo changes

### Why people should care

AI coding agents waste time and make mistakes when they guess the repo setup. RepoBrief gives them the boring but critical facts up front, then catches stale context later.

## Target users

Primary:

- Claude Code users
- Cursor users
- Codex CLI users
- GitHub Copilot users
- OpenCode / Gemini CLI users
- developers using more than one coding agent

Secondary:

- devtool builders
- indie hackers
- engineering teams trying AI coding agents
- open-source maintainers who want agent-ready repos

## Pre-launch checklist

Already done:

- [x] Public GitHub repo
- [x] MIT license
- [x] README
- [x] Usage docs
- [x] Testing docs
- [x] Architecture docs
- [x] GitHub topics
- [x] GitHub Issues enabled
- [x] GitHub Discussions enabled
- [x] Tests pass
- [x] Production npm audit clean (`npm audit --omit=dev`)

Recommended before big launch:

- [ ] Add a short terminal GIF or screenshot to README
- [ ] Decide npm package name (`@fadythebassist/repobrief` is safest)
- [ ] Add GitHub Actions CI for test/typecheck/build
- [ ] Add 2-3 real-world before/after examples
- [ ] Create first GitHub release `v0.1.0`

## 7-day launch sequence

### Day 0 — Polish

- Add demo GIF or screenshot.
- Create GitHub release.
- Open 3 starter issues:
  - `Support monorepos/workspaces`
  - `Add GitHub Actions stale-context check example`
  - `Publish npm package under scoped name`
- Pin the best issue for contributors.

### Day 1 — X launch

Post the launch thread below. Ask for feedback, not stars.

Goal: first 10-25 stars and 2-3 actual clones.

### Day 2 — Hacker News

Post Show HN after the README has a demo visual.

Goal: feedback from skeptical devs. Be ready to answer comments honestly.

### Day 3 — Reddit/dev communities

Post in targeted communities with a practical angle, not a sales pitch.

Best communities:

- r/ClaudeAI
- r/cursor
- r/github
- r/programmingtools
- r/opensource
- relevant Discords/Slacks for AI dev tools

### Day 4 — Direct replies

Search X/GitHub/HN for people complaining about:

- stale CLAUDE.md
- Cursor rules
- AI agents running wrong test commands
- switching between Claude Code/Cursor/Codex

Reply with the tool only when directly relevant.

### Day 5 — Build in public update

Ship one user-requested improvement and post the diff.

### Day 6 — Tutorial post

Write a short dev.to / blog post:

> How to make your repo AI-agent ready in 60 seconds

### Day 7 — Package/install push

If npm scoped package is ready, publish and announce:

```bash
npx @fadythebassist/repobrief write
```

## X launch thread

### Post 1

```text
Your AI coding agent is probably using stale repo context.

You changed from npm to pnpm.
Moved tests.
Added a build step.
But CLAUDE.md / Cursor rules / Copilot instructions still say the old thing.

I built RepoBrief to fix that.

GitHub: https://github.com/fadythebassist/repobrief
```

### Post 2

```text
RepoBrief scans your repo and generates the files coding agents actually read:

- AGENTS.md
- CLAUDE.md
- Cursor rules
- GitHub Copilot instructions
- repo-map.md
- facts.json

No LLM calls. No API keys. No code upload.
```

### Post 3

```text
The useful part is not just generation.

It's drift detection:

repobrief check

If your repo changed but your agent instructions didn't, it tells you exactly what's stale.
```

### Post 4

```text
Example:

You add a build script.
RepoBrief says:

RepoBrief drift detected:
- commands.build:
  + npm run build

That means your AI agent context is now outdated.
```

### Post 5

```text
Why I care:

AI agents waste tokens and make bad edits when they guess project setup.

RepoBrief gives them the boring facts up front:
- package manager
- framework
- test command
- important folders
- generated agent docs
```

### Post 6

```text
It's early, open-source, and intentionally small.

If you use Claude Code, Cursor, Codex, Copilot, OpenCode, or Gemini CLI, try it on a repo and tell me what it misses.

GitHub: https://github.com/fadythebassist/repobrief
```

## Single X post variants

### Direct

```text
I built RepoBrief: a small CLI that keeps AI coding agents aligned with your repo.

It generates AGENTS.md, CLAUDE.md, Cursor rules, Copilot instructions, and detects when they go stale.

No LLM calls. No API keys. Local only.

https://github.com/fadythebassist/repobrief
```

### Funny / sharper

```text
Your CLAUDE.md is probably lying to Claude.

Repo changed. Test commands changed. Package manager changed.
The agent instructions did not.

RepoBrief scans the repo, writes the context files, and checks for drift.

https://github.com/fadythebassist/repobrief
```

### Builder angle

```text
Small weekend devtool:

RepoBrief = repo onboarding packet for AI coding agents.

Scans your codebase → writes AGENTS.md / CLAUDE.md / Cursor rules / Copilot instructions → detects stale context later.

Would love feedback from Claude Code / Cursor / Codex users.

https://github.com/fadythebassist/repobrief
```

## Show HN

### Title

```text
Show HN: RepoBrief – keep AI coding agents aligned with your repo
```

### Body

```text
Hi HN — I built RepoBrief, a small local CLI for people using AI coding agents.

It scans a repo and generates the context files that tools like Claude Code, Cursor, Codex, and GitHub Copilot read:

- AGENTS.md
- CLAUDE.md
- .cursor/rules/project.mdc
- .github/copilot-instructions.md
- .agent-context/repo-map.md
- .agent-context/facts.json

The main feature is drift detection. If your package manager, commands, frameworks, or important folders change, `repobrief check` tells you the agent context is stale.

No LLM calls, no API keys, no source upload. It is deterministic TypeScript.

I built it because agent instruction files tend to be written once and then quietly rot.

Repo: https://github.com/fadythebassist/repobrief

Would love feedback on what repo facts should be detected next.
```

## Reddit/community post

```text
I made a small open-source CLI for people using AI coding agents.

RepoBrief scans your repo and generates AGENTS.md, CLAUDE.md, Cursor rules, and GitHub Copilot instructions. It also has `check`/`diff` commands so you know when those files go stale after repo changes.

No LLM/API dependency — it just inspects package.json, Python config, folders, etc.

I’m looking for feedback from people using Claude Code/Cursor/Codex in real repos: what context do your agents keep missing?

GitHub: https://github.com/fadythebassist/repobrief
```

## README/repo improvements for more stars

Highest impact:

1. Add a demo GIF near the top.
2. Add badges.
3. Add a `Why not just write CLAUDE.md manually?` section.
4. Add real examples for:
   - Next.js app
   - Python/FastAPI app
   - monorepo
5. Add GitHub Actions example:

```yaml
- run: npm run build
- run: node dist/cli.js check --root .
```

## Monetization later

Keep the CLI free/open-source.

Potential paid layers:

1. **GitHub App**: checks PRs for stale agent context.
2. **Team policy packs**: org-specific templates and rules.
3. **Hosted dashboard**: agent-readiness score across repos.
4. **Enterprise MCP/context service**: central context for many repos/agents.
5. **Consulting/productized service**: make a team’s repos AI-agent-ready.

Best first paid wedge:

> GitHub App that comments on PRs when AI-agent context is stale.

## Success metrics

First 24 hours:

- 25+ stars
- 3+ issues/discussions
- 1 external user tries it

First week:

- 100+ stars
- 5+ real issues/feature requests
- npm scoped package published
- one contributor PR or fork

First month:

- CI action added
- monorepo support improved
- real users mention it on X/HN/Reddit
- start GitHub App prototype
