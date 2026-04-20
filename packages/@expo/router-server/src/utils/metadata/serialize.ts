import type { Metadata } from 'expo-server';
import { createElement } from 'react';

import { renderMetadataHtml, renderMetadataTags } from './render';
import { resolveMetadata } from './resolve';

export function serializeMetadataToTags(metadata: Metadata) {
  return renderMetadataTags(resolveMetadata(metadata));
}

export function serializeMetadataToHtml(metadata: Metadata): string {
  return renderMetadataHtml(renderMetadataTags(resolveMetadata(metadata)));
}

export function serializeMetadataToReactElements(metadata: Metadata): React.ReactNode[] {
  return serializeMetadataToTags(metadata).map((tag, index) => {
    if (tag.tagName === 'title') {
      return createElement('title', { key: `metadata-title-${index}` }, tag.content ?? '');
    }

    return createElement(tag.tagName, {
      key: `metadata-${tag.tagName}-${index}`,
      ...(tag.attributes ?? {}),
    });
  });
}
