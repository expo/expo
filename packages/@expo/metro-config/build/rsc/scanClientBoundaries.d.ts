/**
 * Client Boundary Scanner
 *
 * Scans the project for "use client" modules to ensure they're included
 * in the client bundle even when only imported from server components.
 *
 * This solves the chicken-and-egg problem in dev mode where:
 * 1. Client bundle is requested first
 * 2. Server components haven't been processed yet
 * 3. Client boundaries are unknown
 *
 * Similar to Next.js's FlightClientEntryPlugin but for Metro.
 */
/**
 * Scan the project for all client boundary modules.
 * Returns a set of absolute file paths.
 */
export declare function scanForClientBoundaries(projectRoot: string): Set<string>;
/**
 * Get cached client boundaries or scan if cache is empty.
 */
export declare function getClientBoundaries(projectRoot: string): string[];
/**
 * Clear the client boundary cache.
 * Call this when files change or on rebuild.
 */
export declare function clearClientBoundaryCache(): void;
/**
 * Add a client boundary to the cache.
 * Called when a new boundary is discovered during transformation.
 */
export declare function addClientBoundary(filePath: string): void;
/**
 * Check if a file is a known client boundary.
 */
export declare function isKnownClientBoundary(filePath: string): boolean;
/**
 * Debug: print all cached boundaries
 */
export declare function debugClientBoundaries(): void;
