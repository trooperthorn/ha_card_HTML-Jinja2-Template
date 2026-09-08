const OPAQUE_OR_TAG = /(<style[\s\S]*?<\/style>|<[^>]*>)/i;

export function insertLineBreaks(html: string): string {
  return html
    .split(OPAQUE_OR_TAG)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(/\r?\n|\r/g, '<br>')))
    .join('');
}
