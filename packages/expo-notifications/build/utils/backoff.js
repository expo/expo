// See: https://github.com/ide/backoff/blob/0c83ac6/src/backoff.ts
export function computeNextBackoffInterval(initialBackoff, previousRetryCount, { multiplier = 1.5, randomizationFactor = 0.25, minBackoff = initialBackoff, maxBackoff = Infinity, } = {}) {
    // NOTE: These are internal assumptions/assertions of the backoff function, but we're hardcoding
    // these values, so they're replaced with conditions instead, to make this self-documenting
    // The initial backoff interval must be positive
    if (initialBackoff <= 0)
        initialBackoff = 1;
    // The previous retry count must not be negative
    if (previousRetryCount < 0)
        previousRetryCount = 0;
    // The backoff multiplier must be greater than or equal to 1
    if (multiplier < 1)
        multiplier = 1;
    // The minimum backoff interval must be positive
    if (randomizationFactor < 0 || randomizationFactor > 1)
        randomizationFactor = 0;
    const nextBackoff = initialBackoff * multiplier ** previousRetryCount;
    // Apply jitter within the negative to positive range of the randomization factor
    const jitterFactor = 1 - randomizationFactor + 2 * randomizationFactor * Math.random();
    return Math.min(Math.max(nextBackoff * jitterFactor, minBackoff), maxBackoff);
}
//# sourceMappingURL=backoff.js.map