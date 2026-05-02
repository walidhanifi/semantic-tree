# Roadmap

This repository is being developed as a focused HTML heading-structure tool. The items below are the next practical steps for making it more useful beyond the current static-page MVP.

## Near Term

- [ ] Package the CLI properly so it can be installed and invoked as `semantic-tree`
- [x] Add fixture coverage for messy real-world documents from docs sites, blogs, and marketing pages
- [ ] Expand incongruence detection to catch more edge cases around sibling sections and repeated heading resets
- [x] Return optional metadata such as source URL, fetch duration, and heading counts
- [x] Add a small `--format` flag for compact JSON vs pretty output

## Product Improvements

- [x] Support JavaScript-rendered pages via Playwright while keeping the core parser transport-agnostic
- [x] Add request caching and basic rate limiting to the HTTP service
- [x] Expose a health endpoint and structured logs for deployment
- [x] Add a simple HTML report mode for non-technical reviewers
- [ ] Benchmark large documents and reduce repeated DOM traversal where possible

## Audit Rules

- [x] Add optional warnings for missing `h1`, multiple top-level `h1`s, and empty headings
- [x] Flag headings hidden from assistive technologies or generated from empty wrappers
- [ ] Distinguish informational warnings from high-confidence structural errors
- [x] Allow rule toggles so teams can adapt the audit to their own editorial standards

## Developer Experience

- [ ] Publish example outputs and fixture snapshots
- [x] Add npm scripts for coverage and watch mode
- [x] Add a Dockerfile for quick local or cloud deployment
- [ ] Write contribution guidelines and rule-design notes
