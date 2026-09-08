# Backlog

## Verification before the next release

- Live acceptance on the Home Assistant instance: switch the resource per
  `docs/operations.md`, confirm the Yamaha display face is identical on
  Overview, Mobile, and Tablet, and confirm in DevTools that changing the
  receiver volume twenty times produces one `render_template` subscription
  per card instance and no growth.
- Font declaration check: `ledFont` and `displayFont` used by the face are
  declared nowhere in the dashboard sources. Check the instance
  (`/config/themes`, `/config/www`, `configuration.yaml`) for `@font-face` or
  a font resource before flipping the shadow default, since a missing
  declaration means every browser has been falling back to
  `ui-monospace, monospace`.
- Confirm in the live editor that the `template` selector renders its code
  editor for `content`. Core's `TemplateSelector` config schema has no
  `multiline` key, so the option was removed from the editor schema; the
  selector renders a code editor by design, which is multiline. Unverified
  in a running frontend.

## Deferred features

- Flip the `shadow` default to `true` after the live acceptance above passes
  in both modes. Mark it as breaking in the changelog.
- Service-call links (upstream issue 13): a `data-action` click delegate on
  the content wrapper that calls `hass.callService`. Deferred because it adds
  an execution path to sanitised content and needs its own threat review.
- Visual regression capture against a live instance.

## Declined

- Executing `<script>` in content (upstream issue 10): scripts never execute
  through `innerHTML`, and the sanitiser removes them by design.
- Custom event dispatch from content (upstream issue 7): out of scope for a
  rendering card.
