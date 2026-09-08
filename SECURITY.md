# Security Policy

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, private
addresses, or logs. Use GitHub's private vulnerability-reporting feature for
this repository. If private reporting is unavailable, open a minimal issue
asking the maintainer to establish a private channel; omit technical details.

Include the affected version/commit, prerequisites, impact, a minimal
reproduction, and suggested remediation. Remove tokens, API keys, cookies,
entity ids, usernames, and private network details.

## Response targets

These are project targets, not an SLA: acknowledge critical/high reports in
three business days, establish severity and containment in seven, and publish
a coordinated fix/advisory as soon as safely validated. Lower-severity issues
are prioritized by exploitability and impact.

## Supported version

Only the latest published release and the default branch receive security
fixes. Operators should update Home Assistant and this card promptly and
retain a tested rollback.

## Security boundaries

The HTML Jinja2 Template card is a dashboard card that renders HTML authored
by a Home Assistant administrator in the card configuration. The template is
rendered server-side by Home Assistant's own template engine with the
permissions of the viewing user, and the resulting HTML is inserted into the
dashboard page. Because Home Assistant templates do not escape interpolated
state, an entity state or attribute that contains HTML would otherwise reach
the page verbatim. By default the card passes the rendered result through a
DOMPurify profile that keeps markup, `<style>`, `class`, inline `style`, and
the `ha-icon`, `ha-svg-icon`, and `ha-alert` elements, and removes script,
event-handler attributes, `javascript:` URLs, frames, forms, and embeds. The
`allow_unsafe_html: true` option disables that step and is the operator's
responsibility. The sanitiser does not prevent inline CSS from loading remote
resources through `url()`, does not audit the template itself, and cannot
protect against a template author who is already an administrator. The card
has no server-side component and makes exactly one WebSocket subscription
(`render_template`) per card instance.
