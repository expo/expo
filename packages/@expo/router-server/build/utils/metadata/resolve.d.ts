import type { Metadata, ResolvedAppleWebApp, ResolvedMetadata, ResolvedOpenGraph, ResolvedTwitter, ResolvedVerification } from './types';
export declare function resolveMetadata(metadata: Metadata): ResolvedMetadata;
export declare function resolveRobots(robots: Metadata['robots']): {
    robots?: string;
    googleBot?: string;
};
export declare function resolveOpenGraph(openGraph: Metadata['openGraph']): ResolvedOpenGraph | undefined;
export declare function resolveTwitter(twitter: Metadata['twitter']): ResolvedTwitter | undefined;
export declare function resolveVerification(verification: Metadata['verification']): ResolvedVerification | undefined;
export declare function resolveAppleWebApp(appleWebApp: Metadata['appleWebApp']): ResolvedAppleWebApp | undefined;
export declare function resolveOther(other: Metadata['other']): {
    name: string;
    content: string;
}[];
//# sourceMappingURL=resolve.d.ts.map