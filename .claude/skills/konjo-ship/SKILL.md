---
name: konjo-ship
description: Pre-ship checklist for kyro. Run before opening a PR.
---

# Konjo Ship Checklist

Before opening a PR on kyro:

- [ ] `ruff check . && ruff format --check .` — clean
- [ ] `pytest --cov=. --cov-fail-under=80` — coverage ≥ 80%
- [ ] `radon cc -n C .` — zero complexity violations
- [ ] `vulture .` — zero dead code
- [ ] `python3 .konjo/scripts/dry_check.py` — zero DRY violations
- [ ] `interrogate --fail-under=100 .` — docs complete
- [ ] `git diff HEAD~1 | python3 .konjo/scripts/konjo_review.py` — adversarial review clean
- [ ] All CI gates green

Do not open the PR until all items are checked.
