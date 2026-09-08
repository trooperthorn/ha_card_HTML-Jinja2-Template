# Quality scale

Home Assistant's integration quality scale applies to backend integrations,
not dashboard cards. This adapts the same idea, Bronze to Platinum with each
tier a real bar, to what matters for a HACS-distributed card and records this
repository's status against it, including where it falls short.

## Bronze

- [x] README documents every configuration key with its default.
- [x] LICENSE present (MIT, upstream copyright retained).
- [x] CI runs lint, tests, and build on every push and pull request.
- [x] `hacs.json` present with `filename`, `render_readme`, and a
      `homeassistant` floor of `2026.9.0`.
- [x] No abandoned direct dependencies: Lit 3, DOMPurify 3, rollup 3,
      TypeScript 5, vitest 4.

## Silver

- [x] A test suite covering the core logic (31 tests: subscription
      lifecycle, parameter set, error and rejection paths, `do_not_parse`,
      `always_update`, rendering modes, line breaks, theme, sizing,
      registration, the sanitiser profile, and the Yamaha face round trip).
- [x] CI runs the tests, not just lint and build.
- [x] CHANGELOG maintained by hand per CalVer release.
- [ ] Issue templates. Not yet added.

## Gold

- [x] Tagged releases published by the `Release` workflow from the default
      branch, with `dist/html-template-card.js` as the asset and the committed
      bundle verified to match a fresh build.
- [x] CalVer with `package.json` as the single version field, written by
      `scripts/set_version.py` and validated independently by
      `scripts/build_release_artifacts.py`.
- [x] Every workflow action SHA-pinned with a dated comment; top-level
      `permissions: contents: read`; weekly validate and security schedules.
- [x] CodeQL and `npm audit --audit-level=moderate` in CI; zero advisories at
      the time of writing.
- [x] SECURITY.md with explicit boundaries, CODEOWNERS, dependabot, and a
      pull request template.
- [x] Known limitations documented below rather than assumed away.

## Platinum (aspirational)

- [ ] Visual regression tests. The card's rendering depends on `ha-card` and
      on Home Assistant's theme variables, which are not available outside a
      running frontend, so a standalone screenshot would only cover a bare
      div. Deferred until a live-instance capture flow exists.
- [ ] Live verification on a Home Assistant 2026.9 instance. The Yamaha
      display face must render identically from the new resource path on the
      Overview, Mobile, and Tablet dashboards, and DevTools must show exactly
      one `render_template` subscription per card while the receiver volume
      changes. Not yet performed; see `docs/backlog.md`.

## Known limitations

- The render root (light or shadow) is chosen at first render; changing
  `shadow` needs the element recreated.
- `getGridOptions` rows are derived from the measured height and are only
  available after the first render; before that the card claims one row.
- The sanitiser cannot stop inline CSS from loading remote `url()` resources.
- The `template` selector option `multiline` in the editor schema is passed
  through to `ha-form` without verification against the current frontend
  selector definitions; if the frontend ignores it, the field still works as
  a single-line template input.
