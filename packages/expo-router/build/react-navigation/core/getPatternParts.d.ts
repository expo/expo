export type PatternPart = {
    segment: string;
    param?: string;
    regex?: string;
    optional?: boolean;
};
/**
 * Parse a path into an array of parts with information about each segment.
 */
export declare function getPatternParts(path: string): PatternPart[];
//# sourceMappingURL=getPatternParts.d.ts.map