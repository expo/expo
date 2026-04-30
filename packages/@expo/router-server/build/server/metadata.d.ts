import type { ImmutableRequest, Metadata } from 'expo-server';
type ResolveMetadataOptions = {
    route: {
        file: string;
        page: string;
    };
    request: ImmutableRequest;
    params: Record<string, string | string[]>;
};
type ResolvedMetadata = {
    metadata: Metadata;
    headTags: string;
};
export declare function resolveMetadata(options: ResolveMetadataOptions): Promise<ResolvedMetadata | null>;
export {};
//# sourceMappingURL=metadata.d.ts.map