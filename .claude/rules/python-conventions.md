---
paths: ["**/*.py"]
---
# Python Conventions
- No bare `except:` or `except Exception:` — catch specific exceptions; log with `logging.warning` and re-raise
- No mutable default arguments
- `ruff check` and `ruff format` must be clean
- `mypy --strict` must be clean
- No dead code — `vulture` zero tolerance
- `radon cc -n C` zero functions above grade C
- `interrogate --fail-under 100` on all public APIs
- `bandit -ll` zero high-severity security issues
- Use `logging` not `print` in production code
- `__all__` must be defined for every public module
