# HTML Jinja2 Template card

A Home Assistant dashboard card that renders a Jinja2 template as HTML. The
template is rendered by Home Assistant's own template engine, the same one
behind Developer tools, and the server pushes a new result whenever any
entity the template reads changes. This is a maintained fork of the original
card by PiotrMachowski, rebuilt on Lit 3 with a correct subscription
lifecycle, an HTML sanitiser, Sections support, and a visual editor.

## Installation

The card is distributed through HACS as a custom repository.

[![Open your Home Assistant instance and add this repository to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=trooperthorn&repository=ha_card_HTML-Jinja2-Template&category=plugin)

1. In HACS, open the menu, choose Custom repositories, and add
   `https://github.com/trooperthorn/ha_card_HTML-Jinja2-Template` with the
   category Dashboard.
2. Download the card. HACS registers the resource automatically when the
   dashboard resource mode is storage.
3. If the resource is not registered, add it under Settings, Dashboards,
   Resources:

   ```yaml
   url: /hacsfiles/ha_card_HTML-Jinja2-Template/html-template-card.js
   type: module
   ```

4. Hard refresh the browser.

### Switching from the upstream install

The element name is still `html-template-card`, so existing dashboards do not
need any edit. Add this repository in HACS and download it, confirm the new
resource row exists, then remove the upstream repository in HACS so its
resource row is removed as well, and hard refresh. Remove the upstream entry
before verifying, because whichever resource loads first defines the element.
The full procedure and its checks are in `docs/operations.md`.

## Configuration

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | string | required | The Jinja2 template. Its rendered output is inserted as HTML. |
| `title` | string | none | Card title, inserted as text. |
| `entities` | list | none | Entity ids passed to the server as `entity_ids`, for templates whose dependencies the engine cannot detect (loops, `expand`, `states` filtered by attribute). |
| `variables` | map | none | Extra variables available in the template. `config` (the card configuration) and `user` (the viewing user's name) are always set. |
| `strict` | boolean | `true` | Strict rendering: an undefined variable is an error instead of an empty string. |
| `report_errors` | boolean | `false` | Show template errors in the card. Always on while the card is previewed in the editor. |
| `timeout` | number | server default | Render timeout in seconds, passed through to the server. |
| `line_breaks` | boolean | `false` | Insert `<br>` for each newline in the rendered result, outside tags and `<style>` blocks. |
| `ignore_line_breaks` | boolean | `true` | Accepted for compatibility with the upstream card. Newlines are never rewritten unless `line_breaks` is set. |
| `do_not_parse` | boolean | `false` | Render `content` as-is without a template subscription. |
| `allow_unsafe_html` | boolean | `false` | Disable the sanitiser. See Security. |
| `shadow` | boolean | `false` | Render into a shadow root so the card's `<style>` cannot leak into the view. Off by default so existing styling and card-mod paths keep working. |
| `no_card` | boolean | `false` | Render a bare `div` instead of `ha-card`, for picture-elements and other embedded uses. |
| `picture_elements_mode` | boolean | `false` | Alias of `no_card`. |
| `theme` | string | none | Apply a theme from `hass.themes` to this card only. |
| `always_update` | boolean | ignored | Accepted for compatibility and ignored with one console warning. The server already pushes every change the template depends on. |

The card frame padding is `--html-template-card-padding` (default `16px`). The
title uses the `card-header` class.

### Templates and variables

Anything that works in Developer tools works here: `{{ states('sun.sun') }}`,
`{{ state_attr('sun.sun', 'elevation') }}`, `{% if %}` blocks, filters, and
`expand`. The template runs on the server with the viewing user's
permissions. `variables.config` holds the card's own configuration and
`variables.user` the user's display name. Any key under `variables:` in the
configuration is merged in as well. See the Home Assistant
[templating documentation](https://www.home-assistant.io/docs/configuration/templating/).

## Security

The rendered result is HTML built partly from entity state, and Home
Assistant templates do not escape interpolated values. By default the card
passes the result through a DOMPurify profile that keeps normal markup,
`<style>`, `class`, inline `style`, and the `ha-icon`, `ha-svg-icon`, and
`ha-alert` elements, and removes `<script>`, event-handler attributes,
`javascript:` URLs, frames, objects, embeds, and forms. `allow_unsafe_html:
true` turns that off and is the operator's responsibility. The threat model
and the exact profile are in `docs/security.md`.

## Examples

A card with an icon and a state:

```yaml
type: custom:html-template-card
title: Sun
entities:
  - sun.sun
content: |
  <ha-icon icon="mdi:weather-sunny"></ha-icon>
  Sun is <b>{{ states('sun.sun') }}</b>, elevation {{ state_attr('sun.sun', 'elevation') }}
```

Plain content that does not need the template engine:

```yaml
type: custom:html-template-card
do_not_parse: true
content: "<b>Hello</b> there"
```

A styled display face with its own `<style>` block, scoped into a shadow root:

```yaml
type: custom:html-template-card
shadow: true
entities:
  - media_player.receiver
content: >
  <style>
    .face { font-family: ui-monospace, monospace; color: #44d9ff; }
  </style>
  <div class="face">{{ state_attr('media_player.receiver', 'source') }}</div>
```

Inside a picture-elements card:

```yaml
type: picture-elements
image: /local/floorplan.png
elements:
  - type: custom:html-template-card
    no_card: true
    style:
      top: 20%
      left: 30%
    content: "{{ states('sensor.kitchen_temperature') }} °C"
```

## Documentation

- `docs/README.md` indexes the design, security, operations, decisions, and
  quality-scale documents.
- `CHANGELOG.md` lists every behavioural change per release.

## Licence

MIT. The original card is copyright Piotr Machowski; see `LICENSE`.
