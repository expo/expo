import type { Metadata } from 'expo-server';
type MetadataTag = {
    tagName: 'title' | 'meta' | 'link';
    attributes?: Record<string, string>;
    content?: string;
};
export declare function serializeMetadataToTags(metadata: Metadata): MetadataTag[];
export declare function serializeMetadataToHtml(metadata: Metadata): string;
export {};
//# sourceMappingURL=metadata.d.ts.map