import type { Metadata } from 'expo-server';
import type { ReactNode } from 'react';

import { renderMetadataHtml, renderMetadataTags } from './render';
import { resolveMetadata } from './resolve';
import { isTitleTag } from './types';

export function serializeMetadataToTags(metadata: Metadata) {
  return renderMetadataTags(resolveMetadata(metadata));
}

export function serializeMetadataToHtml(metadata: Metadata): string {
  return renderMetadataHtml(renderMetadataTags(resolveMetadata(metadata)));
}

export function serializeMetadataToReact(metadata: Metadata): ReactNode[] {
  return serializeMetadataToTags(metadata).map((tag, index) => {
    if (isTitleTag(tag)) {
      return <title key="metadata-title">{tag.content}</title>;
    }

    return <tag.tagName key={`metadata-${tag.tagName}-${index}`} {...tag.attributes} />;
  });
}
