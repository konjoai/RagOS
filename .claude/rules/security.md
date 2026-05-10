# Security Rules

- Never log API keys, tokens, or embedding vectors containing PII
- Validate all external inputs with Pydantic before processing
- No hardcoded credentials — use environment variables
- Dependencies: `pip-audit` zero high-severity CVEs
- `bandit -ll` zero high-severity findings
- Sanitize any user-provided query strings before passing to ChromaDB
