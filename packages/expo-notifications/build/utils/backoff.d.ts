export declare function computeNextBackoffInterval(initialBackoff: number, previousRetryCount: number, { multiplier, randomizationFactor, minBackoff, maxBackoff, }?: {
    multiplier?: number | undefined;
    randomizationFactor?: number | undefined;
    minBackoff?: number | undefined;
    maxBackoff?: number | undefined;
}): number;
//# sourceMappingURL=backoff.d.ts.map