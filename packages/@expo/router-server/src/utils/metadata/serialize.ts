import type { Metadata } from 'expo-server';

import { renderMetadataHtml, renderMetadataTags } from './render';
import { resolveMetadata } from './resolve';

export function serializeMetadataToTags(metadata: Metadata) {
  return renderMetadataTags(resolveMetadata(metadata));
}

export function serializeMetadataToHtml(metadata: Metadata): string {
  return renderMetadataHtml(renderMetadataTags(resolveMetadata(metadata)));
}
