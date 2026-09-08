# Changelog

The format follows Keep a Changelog. Versions are CalVer `YYYY.MM.DD.N`.

## 2026.09.08.1

First release of the fork. The element name `html-template-card` and the
`content`, `title`, `entities`, `do_not_parse`, `picture_elements_mode`,
`ignore_line_breaks`, and `always_update` keys are still accepted, so
existing dashboards load without edits.

### Breaking

- The rendered HTML is sanitised by default. Script elements, event-handler
  attributes, `javascript:` URLs, iframes, objects, embeds, and forms are
  removed. Normal markup, `<style>`, `class`, inline `style`, and the
  `ha-icon`, `ha-svg-icon`, and `ha-alert` elements are kept. Set
  `allow_unsafe_html: true` to restore the previous behaviour.
- Newlines in the rendered result are no longer rewritten to `</br>`. Set
  `line_breaks: true` to insert `<br>` for newlines outside tags and `<style>`
  blocks. `ignore_line_breaks` is accepted and has no effect.
- `always_update` is ignored and logs one console warning.

### Fixed

- One `render_template` subscription per card instance, opened when the card
  attaches and closed when it detaches or its template changes. The previous
  card opened a new server subscription on every tracked state change and
  never closed any of them.
- Template errors render inside the card instead of leaving it blank.
- A rejected subscription renders the raw content and allows a later retry.
- A missing entity no longer throws while comparing states.
- The card no longer rescans every entity in `hass.states` for substring
  matches on each update; the server tracks the template's dependencies.
- Editing the card in the editor no longer leaves duplicate roots.
- `title` is inserted as text instead of raw HTML.
- Loading the resource twice no longer throws from `customElements.define`.

### Added

- `strict`, `report_errors`, `timeout`, and `variables` are passed to the
  server. `variables` always contains `config` and `user`.
- `allow_unsafe_html`, `shadow`, `theme`, `line_breaks`, and the `no_card`
  alias of `picture_elements_mode`.
- `getGridOptions` for Sections dashboards and a measured `getCardSize`.
- A visual editor (`ha-form`), a card picker entry, and a stub configuration.
- `--html-template-card-padding` CSS variable and the `card-header` class on
  the title.
- Lit 3 and TypeScript source, a vitest suite, SHA-pinned CI, CodeQL, npm
  audit, HACS validation, and the CalVer release pipeline.

### Removed

- `info.md`, the automerge workflow, and the funding file.
