# Design

## Modules

- `src/html-template-card.ts`: the `html-template-card` Lit element, its
  lifecycle, rendering, sizing, and registration.
- `src/ws-templates.ts`: a typed wrapper for the `render_template` WebSocket
  subscription and its result and error message shapes.
- `src/sanitize.ts`: the DOMPurify profile.
- `src/line-breaks.ts`: the optional newline to `<br>` pass.
- `src/theme.ts`: per-card theme application.
- `src/editor.ts`: the `ha-form` based configuration editor.
- `src/register-custom-card.ts`: the `window.customCards` entry.
- `src/types.ts`: the configuration and the minimal `hass` shape the card
  relies on. There is no dependency on `custom-card-helpers`.

## Subscription lifecycle

The card holds at most one subscription promise, `_unsubRenderTemplate`.

- `connectedCallback` calls `_tryConnect`. It returns early when a handle
  already exists, when `hass` or the configuration is missing, or when the
  element is not attached. When `hass` arrives after attachment, `willUpdate`
  calls `_tryConnect` once more, still guarded by the handle.
- `_tryConnect` subscribes with `type: render_template`, `template`,
  `entity_ids`, `variables`, `strict`, `report_errors`, and `timeout`. The
  callback branches on `error` in the message: an error is stored and rendered
  in `div.html-template-card-error`; a result replaces the rendered content
  and clears any previous error. If the subscription promise rejects, the
  handle is cleared and the raw content is rendered so the card is never
  blank and a later attach retries.
- `disconnectedCallback` calls `_tryDisconnect`, which clears the handle
  first and then awaits the promise and the unsubscribe function, swallowing
  errors from a connection that already closed.
- `setConfig` compares the keys that affect the subscription (`content`,
  `entities`, `variables`, `strict`, `report_errors`, `timeout`,
  `do_not_parse`) with the previous configuration and only then disconnects
  and reconnects. A change to `title`, `theme`, `shadow`, or another
  rendering key re-renders without touching the server.
- `do_not_parse` skips the subscription entirely and renders `content`.

## Why server tracking replaced the client scan

The upstream card scanned every key of `hass.states` for a substring match
against the template on each `hass` assignment, subscribed again on every
match, and never unsubscribed. The `render_template` command already returns
the entities, domains, and time dependencies it detected and pushes a new
result on each change, so the client-side scan was redundant, wrong for
templates that build entity ids dynamically, and the direct cause of the
unbounded subscription growth. The only client-side input that remains is
`entities`, forwarded as `entity_ids` for the cases the engine cannot infer.

## Light DOM versus shadow DOM

By default the card renders into its own light DOM, exactly like the upstream
card. A `<style>` block in the content therefore applies within the view's
scope, which is what existing dashboards rely on, and card-mod selectors that
reach into the card keep working. With `shadow: true` the card renders into a
shadow root: the content's styles are scoped to the card, theme CSS variables
still inherit, and `@font-face` rules declared at document level still
resolve. The render root is chosen when the element first renders, so
toggling `shadow` requires the card to be recreated, which the editor does.

## Why always_update is retired

`always_update` forced a full resubscribe on every `hass` assignment, which
happens on every state change in the whole instance. With one server-side
subscription there is nothing to force: the server pushes every change the
template depends on. The key is accepted so old configurations load, and one
console warning notes that it does nothing.

## Sizing

`getCardSize` returns the rendered height in 50 px units, at least 1.
`getGridOptions` claims the full 12 columns with a minimum of 3, and derives
`rows` from the rendered height using the 56 px cell and 8 px gap of the
Sections grid once the card has been measured.
