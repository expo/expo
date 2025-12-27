"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanForClientBoundaries = scanForClientBoundaries;
exports.getClientBoundaries = getClientBoundaries;
exports.clearClientBoundaryCache = clearClientBoundaryCache;
exports.addClientBoundary = addClientBoundary;
exports.isKnownClientBoundary = isKnownClientBoundary;
exports.debugClientBoundaries = debugClientBoundaries;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Cache of discovered client boundaries: filePath -> output key
const clientBoundaryCache = new Map();
// Directories to skip during scanning
const SKIP_DIRS = new Set([
    '.git',
    '.expo',
    '.next',
    'dist',
    'build',
    '__tests__',
    '__mocks__',
    'coverage',
]);
// File extensions to scan
const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
// Regex to detect "use client" directive at the start of a file
// Handles: 'use client', "use client", with optional semicolon and whitespace
const USE_CLIENT_REGEX = /^(?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*)*['"]use client['"]/;
/**
 * Check if a file has "use client" directive by reading first few bytes.
 * Optimized for speed - only reads enough to detect the directive.
 */
function hasUseClientDirective(filePath) {
    try {
        // Read only the first 500 bytes - directive must be at the top
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(500);
        const bytesRead = fs.readSync(fd, buffer, 0, 500, 0);
        fs.closeSync(fd);
        const content = buffer.toString('utf8', 0, bytesRead);
        return USE_CLIENT_REGEX.test(content);
    }
    catch {
        return false;
    }
}
/**
 * Recursively scan a directory for client boundary modules.
 */
function scanDirectory(dir, projectRoot, results, maxDepth = 10) {
    if (maxDepth <= 0)
        return;
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip certain directories
            if (SKIP_DIRS.has(entry.name))
                continue;
            // For node_modules, only scan top-level packages (not nested node_modules)
            if (entry.name === 'node_modules') {
                // Scan one level into node_modules to find packages
                scanNodeModules(fullPath, projectRoot, results);
                continue;
            }
            scanDirectory(fullPath, projectRoot, results, maxDepth - 1);
        }
        else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (SCAN_EXTENSIONS.has(ext) && hasUseClientDirective(fullPath)) {
                results.add(fullPath);
            }
        }
    }
}
/**
 * Scan node_modules for client boundary modules.
 * Only scans packages that are likely to have "use client" (React-related).
 */
function scanNodeModules(nodeModulesPath, projectRoot, results) {
    let entries;
    try {
        entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const packagePath = path.join(nodeModulesPath, entry.name);
        // Handle scoped packages (@org/pkg)
        if (entry.name.startsWith('@')) {
            try {
                const scopedEntries = fs.readdirSync(packagePath, { withFileTypes: true });
                for (const scopedEntry of scopedEntries) {
                    if (scopedEntry.isDirectory()) {
                        const scopedPackagePath = path.join(packagePath, scopedEntry.name);
                        scanPackage(scopedPackagePath, projectRoot, results);
                    }
                }
            }
            catch {
                // Ignore errors
            }
            continue;
        }
        scanPackage(packagePath, projectRoot, results);
    }
}
/**
 * Scan a single package for client boundary modules.
 * Uses heuristics to skip packages unlikely to have "use client".
 */
function scanPackage(packagePath, projectRoot, results) {
    // Read package.json to check if it's likely to have client components
    const pkgJsonPath = path.join(packagePath, 'package.json');
    try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        // Skip packages that are clearly server-only or non-React
        const name = pkgJson.name || '';
        if (name.includes('server-only') ||
            name.includes('eslint') ||
            name.includes('prettier') ||
            name.includes('typescript') ||
            name.includes('@types/')) {
            return;
        }
        // Check for React-related dependencies (more likely to have "use client")
        const deps = {
            ...pkgJson.dependencies,
            ...pkgJson.peerDependencies,
        };
        const hasReact = deps && (deps.react || deps['react-native'] || deps['react-dom']);
        // Only scan if it has React dependencies
        if (hasReact) {
            scanDirectory(packagePath, projectRoot, results, 5);
        }
    }
    catch {
        // If we can't read package.json, skip this package
    }
}
/**
 * Scan the project for all client boundary modules.
 * Returns a set of absolute file paths.
 */
function scanForClientBoundaries(projectRoot) {
    const results = new Set();
    // Scan app source code
    scanDirectory(projectRoot, projectRoot, results);
    return results;
}
/**
 * Get cached client boundaries or scan if cache is empty.
 */
function getClientBoundaries(projectRoot) {
    if (clientBoundaryCache.size === 0) {
        const boundaries = scanForClientBoundaries(projectRoot);
        for (const boundary of boundaries) {
            clientBoundaryCache.set(boundary, boundary);
        }
    }
    return Array.from(clientBoundaryCache.keys());
}
/**
 * Clear the client boundary cache.
 * Call this when files change or on rebuild.
 */
function clearClientBoundaryCache() {
    clientBoundaryCache.clear();
}
/**
 * Add a client boundary to the cache.
 * Called when a new boundary is discovered during transformation.
 */
function addClientBoundary(filePath) {
    clientBoundaryCache.set(filePath, filePath);
}
/**
 * Check if a file is a known client boundary.
 */
function isKnownClientBoundary(filePath) {
    return clientBoundaryCache.has(filePath);
}
/**
 * Debug: print all cached boundaries
 */
function debugClientBoundaries() {
    console.log('\n=== Client Boundary Cache ===');
    console.log(`Total: ${clientBoundaryCache.size}`);
    for (const [filePath] of clientBoundaryCache) {
        console.log(`  ${filePath}`);
    }
    console.log('=============================\n');
}
//# sourceMappingURL=scanClientBoundaries.js.map