import { Href } from '../types';
export type SitemapType = {
    contextKey: string;
    filename: string;
    href: string | Href;
    isInitial: boolean;
    isInternal: boolean;
    isGenerated: boolean;
    children: SitemapType[];
};
export declare function useSitemap(): SitemapType | null;
//# sourceMappingURL=useSitemap.d.ts.map