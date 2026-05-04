import { isTitleTag, MetadataTag } from './types';

export function renderMetadataTag(tag: MetadataTag): string {
  if (isTitleTag(tag)) {
    return `<title>${escapeHtmlTextNode(tag.content ?? '')}</title>`;
  }

  const attributes = tag.attributes
    ? ' ' +
      Object.entries(tag.attributes)
        .filter(([, value]) => value != null && value !== '')
        .map(([key, value]) => `${key}="${escapeHtmlAttributeValue(value)}"`)
        .join(' ')
    : '';

  return `<${tag.tagName}${attributes}>`;
}

export function pushName(tags: MetadataTag[], key: string, value: string | undefined) {
  pushMetaContent(tags, 'name', key, value);
}

export function pushProperty(tags: MetadataTag[], key: string, value: string | undefined) {
  pushMetaContent(tags, 'property', key, value);
}

export function pushLink(tags: MetadataTag[], attributes: Record<string, string | undefined>) {
  const normalizedAttributes = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value != null && value !== '')
  ) as Record<string, string>;

  if (Object.keys(normalizedAttributes).length === 0) {
    return;
  }

  tags.push({
    tagName: 'link',
    attributes: normalizedAttributes,
  });
}

function escapeHtmlAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlTextNode(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pushMetaContent(
  tags: MetadataTag[],
  name: 'name' | 'property',
  key: string,
  value: string | undefined
) {
  if (!value) return;
  tags.push({
    tagName: 'meta',
    attributes: {
      [name]: key,
      content: value,
    },
  });
}
