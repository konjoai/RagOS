# Testing Rules

- Coverage ≥ 80% enforced by CI
- Mutation survival ≤ 10% (mutmut)
- Every public function must have at least one test
- Use `pytest` with `pytest-cov`
- Mock external services (Ollama, ChromaDB) in unit tests
- Integration tests tagged with `@pytest.mark.integration` and skipped in CI unless explicitly enabled
