# Konjo

Run a full Konjo quality check on the current kyro codebase.

## Steps

1. **Lint**: `ruff check . && ruff format --check .`
2. **Tests**: `pytest --tb=short`
3. **Coverage**: `pytest --cov=. --cov-report=term-missing --cov-fail-under=80`
4. **Complexity**: `radon cc -n C .`
5. **Dead code**: `vulture .`
6. **DRY**: `python3 .konjo/scripts/dry_check.py`
7. **Docs**: `interrogate --fail-under=100 .`
8. **Adversarial review**: `git diff HEAD~1 | python3 .konjo/scripts/konjo_review.py`

See `KONJO_QUALITY_FRAMEWORK.md` and `KONJO_PROMPT.md` for full details.
