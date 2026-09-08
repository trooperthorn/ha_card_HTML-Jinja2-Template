import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../src/sanitize';
import { insertLineBreaks } from '../src/line-breaks';

function parse(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

describe('sanitizeHtml strips', () => {
  it('event handler attributes', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)"><div onclick="x()">t</div>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onclick');
    expect(out).toContain('<img src="x">');
  });

  it('script, iframe, object, embed, and form elements', () => {
    const out = sanitizeHtml(
      '<script>alert(1)</script><iframe src="https://x"></iframe><object data="x"></object><embed src="x"><form><input></form><p>keep</p>',
    );
    expect(out).not.toMatch(/script|iframe|object|embed|form|input/);
    expect(out).toContain('<p>keep</p>');
  });

  it('javascript: URLs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a><a href="https://example.com">y</a>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('href="https://example.com"');
  });

  it('SVG onload handlers', () => {
    const out = sanitizeHtml('<svg onload="alert(1)"><circle r="1"></circle></svg>');
    expect(out).not.toContain('onload');
  });
});

describe('sanitizeHtml keeps', () => {
  it('style blocks, class and inline style attributes', () => {
    const out = sanitizeHtml('<style>.a{color:red}</style><div class="a b" style="color: blue">t</div>');
    expect(out).toContain('<style>.a{color:red}</style>');
    expect(out).toContain('class="a b"');
    expect(out).toContain('style="color: blue"');
  });

  it('ha-icon, ha-svg-icon, and ha-alert with their attributes', () => {
    const out = sanitizeHtml(
      '<ha-icon icon="mdi:speaker"></ha-icon><ha-svg-icon path="M0 0h24"></ha-svg-icon><ha-alert alert-type="warning" title="t">m</ha-alert>',
    );
    const root = parse(out);
    expect(root.querySelector('ha-icon')?.getAttribute('icon')).toBe('mdi:speaker');
    expect(root.querySelector('ha-svg-icon')?.getAttribute('path')).toBe('M0 0h24');
    expect(root.querySelector('ha-alert')?.getAttribute('alert-type')).toBe('warning');
    expect(root.querySelector('ha-alert')?.getAttribute('title')).toBe('t');
  });

  it('drops other custom elements', () => {
    const out = sanitizeHtml('<my-widget on="x">inner</my-widget>');
    expect(out).not.toContain('my-widget');
    expect(out).toContain('inner');
  });

  it('the Yamaha display face round-trips with style, classes, and grid intact', () => {
    const fixture = readFileSync(resolve(process.cwd(), 'test/fixtures/yamaha-face.html'), 'utf8');
    const out = sanitizeHtml(fixture);
    const styleIn = /<style>[\s\S]*?<\/style>/.exec(fixture)?.[0];
    expect(out).toContain(styleIn);
    const before = parse(fixture);
    const after = parse(out);
    const classesBefore = Array.from(before.querySelectorAll('[class]')).map((e) => e.className);
    const classesAfter = Array.from(after.querySelectorAll('[class]')).map((e) => e.className);
    expect(classesAfter).toEqual(classesBefore);
    expect(classesBefore.length).toBeGreaterThan(10);
    expect(after.querySelector('.face .grid .kvline .kv .value.value-glow')?.textContent).toBe('STEREO');
    expect(after.querySelector('.grid .vol')?.textContent).toBe('42.5');
    expect(after.querySelector('.grid .center-source')?.textContent).toBe('TV Audio');
    expect(after.querySelector('.grid .bottom-mode')?.textContent).toBe('2CH STEREO');
    expect(after.innerHTML).toBe(before.innerHTML);
  });
});

describe('insertLineBreaks', () => {
  it('replaces newlines outside tags and leaves tags and style blocks alone', () => {
    const out = insertLineBreaks('a\nb<div\nclass="x">c\r\nd</div><style>\n.a{}\n</style>e\n');
    expect(out).toBe('a<br>b<div\nclass="x">c<br>d</div><style>\n.a{}\n</style>e<br>');
  });
});
