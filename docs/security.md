# Security

## Threat model

Trusted: the `content` template. It is written by a dashboard administrator
and rendered by Home Assistant's template engine with the viewing user's
permissions. Nothing the card does can extend those permissions.

Untrusted: every value the template interpolates. Entity states, attributes,
device names, media titles, and source names come from integrations and from
the devices behind them. Home Assistant templates do not escape interpolated
text, so a state such as `<img src=x onerror="...">` reaches the rendered
result verbatim. Inserting that result with `innerHTML` does not execute
`<script>` elements, but it does execute event-handler attributes,
`javascript:` URLs, and SVG `onload`, and it renders frames and forms.

## What the profile removes

`src/sanitize.ts` runs DOMPurify with a fixed profile:

- All `on*` attributes (DOMPurify default).
- `javascript:` and other non-http URI schemes in `href`, `src`, and similar
  attributes (DOMPurify default).
- `script`, `iframe`, `object`, `embed`, `base`, `form`, `input`, `textarea`,
  `select`, and `button` elements, listed explicitly in `FORBID_TAGS`.
- Custom elements other than `ha-icon`, `ha-svg-icon`, and `ha-alert`; their
  text content is kept.

## What the profile keeps

- Normal HTML markup and SVG.
- `<style>` elements (`ADD_TAGS`, with `FORCE_BODY` so a leading `<style>` is
  not moved into a discarded document head).
- `class` and inline `style` attributes.
- `ha-icon`, `ha-svg-icon`, and `ha-alert` with the `icon`, `path`,
  `alert-type`, and `title` attributes, through `CUSTOM_ELEMENT_HANDLING`.

The test suite round-trips the Yamaha receiver display face used on the
household dashboards through the profile and asserts that the `<style>` block,
every class attribute, and the grid markup are byte-identical afterwards.

## What it cannot prevent

- Inline CSS can still load remote resources through `url()`, which leaks the
  viewer's IP address and the fact that the dashboard was opened. It cannot
  execute code.
- The template itself is not audited. An administrator can write anything.
- `allow_unsafe_html: true` disables the profile entirely. Use it only for
  content that is fully authored in the configuration and interpolates no
  untrusted values.
- The `title` key is inserted as text and never as HTML.

## Reporting

See `SECURITY.md` in the repository root.
