# Git Workflow

## Branch naming
- `feat/<name>` — new feature
- `fix/<name>` — bug fix
- `chore/<name>` — maintenance

## Before committing
1. `ruff check . && ruff format --check .` — lint clean
2. `pytest --tb=short` — all tests pass
3. Pre-commit hook runs automatically (Wall 1)

## Commit messages
- Imperative mood: "add retrieval pipeline" not "added"
- Reference issue if applicable: `fix: correct embedding dim (#42)`

## PRs
- All CI gates must pass (Wall 2)
- Request review after CI green
