import DOMPurify from 'dompurify';

const HA_ELEMENT = /^ha-(icon|svg-icon|alert)$/;
const HA_ATTRIBUTE = /^(icon|path|alert-type|title)$/;

const PROFILE = {
  ADD_TAGS: ['style'],
  ADD_ATTR: ['class', 'style'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'textarea', 'select', 'button'],
  FORCE_BODY: true,
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: (tagName: string): boolean => HA_ELEMENT.test(tagName),
    attributeNameCheck: (attributeName: string): boolean => HA_ATTRIBUTE.test(attributeName),
    allowCustomizedBuiltInElements: false,
  },
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, PROFILE) as string;
}
