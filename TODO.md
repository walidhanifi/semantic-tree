# Roadmap

This repository is being developed as a focused HTML heading-audit tool. The items below are the next practical steps for making it more useful beyond the current static-page MVP.

## Near Term

- [ ] Package the CLI properly so it can be installed and invoked as `heading-audit`
- [x] Add fixture coverage for messy real-world documents from docs sites, blogs, and marketing pages
- [ ] Expand incongruence detection to catch more edge cases around sibling sections and repeated heading resets
- [ ] Return optional metadata such as source URL, fetch duration, and heading counts
- [ ] Add a small `--format` flag for compact JSON vs pretty output

## Product Improvements

- [ ] Support JavaScript-rendered pages via Playwright while keeping the core parser transport-agnostic
- [ ] Add request caching and basic rate limiting to the HTTP service
- [ ] Expose a health endpoint and structured logs for deployment
- [ ] Add a simple HTML report mode for non-technical reviewers
- [ ] Benchmark large documents and reduce repeated DOM traversal where possible

## Audit Rules

- [x] Add optional warnings for missing `h1`, multiple top-level `h1`s, and empty headings
- [ ] Flag headings hidden from assistive technologies or generated from empty wrappers
- [ ] Distinguish informational warnings from high-confidence structural errors
- [ ] Allow rule toggles so teams can adapt the audit to their own editorial standards

## Developer Experience

- [ ] Publish example outputs and fixture snapshots
- [ ] Add npm scripts for coverage and watch mode
- [ ] Add a Dockerfile for quick local or cloud deployment
- [ ] Write contribution guidelines and rule-design notes
