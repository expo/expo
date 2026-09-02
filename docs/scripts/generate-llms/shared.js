import {
  DOCS_BASE_URL,
  getMarkdownHref,
  getMarkdownUrl,
  rewriteDocsLinksToMarkdown,
} from '../markdown-link-utils.ts';

export { DOCS_BASE_URL, getMarkdownHref, getMarkdownUrl, rewriteDocsLinksToMarkdown };

export const OUTPUT_DIRECTORY_NAME = 'public';

export function toBlockquote(text) {
  return text
    .split('\n')
    .map(line => (line.length > 0 ? `> ${line}` : '>'))
    .join('\n');
}
