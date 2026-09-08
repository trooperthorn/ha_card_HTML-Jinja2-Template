# Operations

## Configuration keys and their consequences

| Key | Effect when set |
| --- | --- |
| `content` | Sent as the `template` of one `render_template` subscription. Changing it closes the old subscription and opens a new one. Required; the card throws from `setConfig` without it. |
| `title` | Rendered as text in a `div.card-header > div.name` above the content. HTML in the title is shown literally. |
| `entities` | Sent as `entity_ids`. Use it when the engine cannot detect a dependency, for example an entity id built in a loop. Changing it resubscribes. |
| `variables` | Merged into the subscription's `variables` under the reserved `config` and `user` keys. Changing it resubscribes. |
| `strict` | `true` by default. With `false`, undefined variables render as empty strings instead of raising. Changing it resubscribes. |
| `report_errors` | `false` by default. With `true`, the server sends template errors as events and the card shows them in `div.html-template-card-error`. Forced on in the editor preview. |
| `timeout` | Passed through as the render timeout in seconds. |
| `line_breaks` | Inserts `<br>` for each newline in the rendered result outside tags and `<style>` blocks. Off by default. |
| `ignore_line_breaks` | No effect. Accepted so upstream configurations load. |
| `do_not_parse` | No subscription; `content` is rendered directly through the same line-break and sanitiser steps. |
| `allow_unsafe_html` | Skips the sanitiser. See `docs/security.md`. |
| `shadow` | Renders into a shadow root. The render root is fixed at first render, so toggle it in the editor or reload the page. |
| `no_card`, `picture_elements_mode` | Renders `div.html-template-card-content` without an `ha-card` frame or title. |
| `theme` | Sets the theme's CSS custom properties on the card element and removes them again when the key is removed. `default` and unknown theme names apply nothing. |
| `always_update` | Ignored; one console warning per page load. |

CSS: `--html-template-card-padding` (default `16px`) sets the card frame
padding. The title uses class `card-header`, the content wrapper
`html-template-card-content`, and an error `html-template-card-error`.

## Switching from the upstream install

1. In HACS add `https://github.com/trooperthorn/ha_card_HTML-Jinja2-Template`
   as a custom repository with category Dashboard, then download it.
2. Open Settings, Dashboards, Resources and confirm a row for
   `/hacsfiles/ha_card_HTML-Jinja2-Template/html-template-card.js` with type
   module exists. Add it if HACS did not.
3. Remove the upstream repository from HACS. That removes its resource row.
   Do this before verifying, because both resources define the same element
   and the first one to load wins.
4. Hard refresh every browser and kiosk.
5. Confirm the console banner `HTML-TEMPLATE-CARD Version 2026.09.08.1` and
   that each card renders. No dashboard edit is needed.

Rollback: remove this repository in HACS, add the upstream repository again,
download it, and hard refresh.

## Troubleshooting

Blank card:

- With `report_errors: true` the error appears in the card. Without it,
  the server may have sent a warning-level error the card does not show;
  open the template in Developer tools.
- A template that reads an entity which does not exist raises under
  `strict: true`. Either fix the id or set `strict: false`.
- The sanitiser removed everything: check for content that is only a
  `<script>`, `<iframe>`, or form. Set `allow_unsafe_html: true` only for
  content with no interpolated state.

Card does not update:

- The engine only tracks entities it can see in the template. Add the ids to
  `entities`.
- Check the browser console for a closed WebSocket; the card reconnects when
  it is re-attached, so reloading the page is sufficient.

Fonts:

- A `font-family` used in a `<style>` block must be declared somewhere the
  browser can see it: a theme, a resource, or an `@font-face` in the content.
  Shadow DOM does not change this; `@font-face` at document level resolves
  inside a shadow root.

Editor:

- The editor is `html-template-card-editor` and uses `ha-form`. If it fails
  to load, the card still renders; the editor is isolated from rendering.

## Releasing

`package.json` carries the version. A merge to the default branch runs
`Release`, which validates the version, rebuilds `dist/` and refuses drift,
tags `v<version>`, and uploads `dist/html-template-card.js`. `Prepare
release` then opens the next CalVer bump PR when release-bearing paths
(`src`, `package.json`, `package-lock.json`, `rollup.config.js`, `dist`)
changed. Run `npm run build` and commit `dist/` with every source change,
because CI fails on a stale bundle.
