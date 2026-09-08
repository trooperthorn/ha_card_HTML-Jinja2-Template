# Decisions

## 2026-09-08: keep the element name html-template-card

The fork registers the same `html-template-card` element as the upstream
card. Rejected: a fork-specific name, which would have required editing three
household dashboards for no functional gain. The cost is that the upstream
resource and this one cannot coexist; `docs/operations.md` documents the
switch. The define is guarded with `customElements.get` so loading the
resource twice during the switch does not throw.

## 2026-09-08: newlines are left alone by default

The upstream card rewrote every newline in the template to an invalid `</br>`
before rendering, which also rewrote Jinja blocks and `<style>` content, and
required `ignore_line_breaks: true` on any non-trivial card. The fork never
rewrites newlines unless `line_breaks: true` is set, and then only in the
rendered result, outside tags and `<style>` blocks, using `<br>`.
`ignore_line_breaks` is still accepted so old configurations load. Rejected:
keeping the old default, which would have carried a known defect forward.

## 2026-09-08: the sanitiser is on by default

The rendered HTML mixes trusted template text with untrusted interpolated
state. The DOMPurify profile in `docs/security.md` removes the executable
surface while keeping `<style>`, classes, inline style, and the Home Assistant
icon and alert elements. `allow_unsafe_html: true` is the documented opt-out.
Rejected: sanitising only on opt-in, which would leave the default install
exposed to any integration that reports a crafted name. The bundle grows by
about 20 KB for DOMPurify, which is accepted.

## 2026-09-08: shadow DOM is opt-in

`shadow: true` scopes the content's styles to the card. The default stays
light DOM because the household dashboards and any card-mod usage were built
against light DOM, and the display face has not yet been verified pixel for
pixel in shadow mode on the live instance. The default flips only after that
verification; see `docs/backlog.md`.

## 2026-09-08: Lit 3 and no custom-card-helpers

The card is rewritten on Lit 3 to match the other maintained card
repositories. The minimal `hass` shape it needs is declared in `src/types.ts`
instead of depending on `custom-card-helpers`, which is unmaintained and has
already broken another card in this collection by hard-coding Home Assistant
internals.

## 2026-09-08: no upstream contributions

Fixes and features stay in this fork. No pull requests or issues are opened on
the upstream repository. The upstream issues that informed the rewrite are
listed in `docs/backlog.md` where they are deferred.
