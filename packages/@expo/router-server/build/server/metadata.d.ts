import type { ImmutableRequest, Metadata } from 'expo-server';
import type { ReactNode } from 'react';
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
    headNodes: ReactNode[];
};
export declare function resolveMetadata(options: ResolveMetadataOptions): Promise<ResolvedMetadata | null>;
export {};
//# sourceMappingURL=metadata.d.ts.map