# Contributing

Semantic Tree is intentionally small. Changes should keep the core parser easy to read and avoid adding heavy abstractions unless they clearly reduce complexity.

## Local Workflow

```bash
npm install
npm run build
npm test
npm run lint
```

Useful extras:

```bash
npm run test:watch
npm run test:coverage
```

## Project Layout

- `src/index.ts` holds the parser, semantic tree builder, incongruence check, and warning collection
- `src/cli.ts` is the command-line wrapper
- `src/server.ts` is the HTTP wrapper
- `src/output.ts` shapes response metadata
- `src/report.ts` renders the optional HTML report
- `fixtures/` contains stable HTML samples and expected outputs used in regression tests
- `examples/` contains hand-picked outputs that make the tool easier to skim from the repo homepage

## Rule Design Notes

When adding an audit rule:

1. Keep the rule close to the parser output unless it clearly belongs in transport or presentation code.
2. Prefer plain data in and plain data out.
3. Reuse the existing `WarningRule` and rule-toggle flow so CLI and API behavior stay aligned.
4. Add at least one narrow unit test and one HTML-level integration test when the rule changes parser behavior.
5. If the rule is heuristic rather than strict, keep the warning copy specific so users can judge whether to ignore it.

## Fixtures And Examples

- Add or update a fixture in `fixtures/` when you want a stable regression case.
- Keep fixture HTML short and purpose-built. It should isolate a behavior, not mimic an entire production site.
- If the change is useful to showcase publicly, add or refresh a matching file under `examples/`.

## Commit Style

Use conventional commits where possible:

- `feat(...)` for behavior changes
- `fix(...)` for bug fixes
- `test(...)` for test-only changes
- `docs(...)` for documentation changes
- `chore(...)` for repo or tooling work
