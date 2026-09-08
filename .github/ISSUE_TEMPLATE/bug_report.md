---
name: Bug report
about: The card renders wrongly, stops updating, or logs an error
title: ''
labels: bug
assignees: ''
---

## Versions

- Card release (from the console banner or HACS):
- Home Assistant core:
- Browser and operating system:

## Card configuration

Paste the card YAML with private entity ids, names, and hostnames replaced by placeholders.

```yaml
type: custom:html-template-card
```

## What happens

Describe what renders, and what you expected. If the card shows an error, paste the error text. If it stops updating, say how many state changes it took and whether a page reload restores it.

## Console and network

Open the browser developer tools before reproducing. Paste any console line that mentions `html-template-card` or `render_template`, and say how many `render_template` subscriptions the WebSocket frames show for this card.
