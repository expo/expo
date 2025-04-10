"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFingerprintFromSourcesAsync = createFingerprintFromSourcesAsync;
exports.createFingerprintSourceAsync = createFingerprintSourceAsync;
exports.createFileHashResultsAsync = createFileHashResultsAsync;
exports.createDirHashResultsAsync = createDirHashResultsAsync;
exports.createContentsHashResultsAsync = createContentsHashResultsAsync;
exports.createSourceId = createSourceId;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const promises_1 = __importDefault(require("fs/promises"));
const p_limit_1 = __importDefault(require("p-limit"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const FileHookTransform_1 = require("./FileHookTransform");
const ReactImportsPatcher_1 = require("./ReactImportsPatcher");
const Path_1 = require("../utils/Path");
const Predicates_1 = require("../utils/Predicates");
const Profile_1 = require("../utils/Profile");
/**
 * Create a `Fingerprint` from `HashSources` array
 */
async function createFingerprintFromSourcesAsync(sources, projectRoot, options) {
    const limiter = (0, p_limit_1.default)(options.concurrentIoLimit);
    const fingerprintSources = await Promise.all(sources.map((source) => createFingerprintSourceAsync(source, limiter, projectRoot, options)));
    const hasher = (0, crypto_1.createHash)(options.hashAlgorithm);
    for (const source of fingerprintSources) {
        if (source.hash != null) {
            hasher.update(createSourceId(source));
            hasher.update(source.hash);
        }
    }
    const hash = hasher.digest('hex');
    return {
        sources: fingerprintSources,
        hash,
    };
}
/**
 * Create a `FingerprintSource` from a `HashSource`
 * This function will get a hash value and merge back to original source
 */
async function createFingerprintSourceAsync(source, limiter, projectRoot, options) {
    let result = null;
    switch (source.type) {
        case 'contents':
            result = await createContentsHashResultsAsync(source, options);
            break;
        case 'file':
            result = await createFileHashResultsAsync(source.filePath, limiter, projectRoot, options);
            break;
        case 'dir':
            result = await (0, Profile_1.profile)(options, createDirHashResultsAsync, `createDirHashResultsAsync(${source.filePath})`)(source.filePath, limiter, projectRoot, options);
            break;
        default:
            throw new Error('Unsupported source type');
    }
    return {
        ...source,
        hash: result?.hex ?? null,
        ...(options.debug ? { debugInfo: result?.debugInfo } : undefined),
    };
}
/**
 * Create a `HashResult` from a file
 */
async function createFileHashResultsAsync(filePath, limiter, projectRoot, options) {
    // Backup code for faster hashing
    /*
    return limiter(async () => {
      if (isIgnoredPathWithMatchObjects(filePath, options.ignorePathMatchObjects)) {
        return null;
      }
  
      const hasher = createHash(options.hashAlgorithm);
  
      const stat = await fs.stat(filePath);
      hasher.update(`${stat.size}`);
  
      const buffer = Buffer.alloc(4096);
      const fd = await fs.open(filePath, 'r');
      await fd.read(buffer, 0, buffer.length, 0);
      await fd.close();
      hasher.update(buffer);
      console.log('stat', filePath, stat.size);
      return { id: path.relative(projectRoot, filePath), hex: hasher.digest('hex') };
    });
    */
    return limiter(() => {
        return new Promise((resolve, reject) => {
            if ((0, Path_1.isIgnoredPathWithMatchObjects)(filePath, options.ignorePathMatchObjects)) {
                return resolve(null);
            }
            let resolved = false;
            const hasher = (0, crypto_1.createHash)(options.hashAlgorithm);
            const fileHookTransform = options.fileHookTransform
                ? new FileHookTransform_1.FileHookTransform({ type: 'file', filePath }, options.fileHookTransform, options.debug)
                : null;
            let stream = (0, fs_1.createReadStream)(path_1.default.join(projectRoot, filePath), {
                highWaterMark: 1024,
            });
            if (options.enableReactImportsPatcher &&
                (filePath.endsWith('.h') || filePath.endsWith('.m') || filePath.endsWith('.mm'))) {
                const transform = new ReactImportsPatcher_1.ReactImportsPatchTransform();
                stream = (0, stream_1.pipeline)(stream, transform, (err) => {
                    if (err) {
                        reject(err);
                    }
                });
            }
            if (fileHookTransform) {
                stream = (0, stream_1.pipeline)(stream, fileHookTransform, (err) => {
                    if (err) {
                        reject(err);
                    }
                });
            }
            stream.on('close', () => {
                if (!resolved) {
                    const hex = hasher.digest('hex');
                    const isTransformed = fileHookTransform?.isTransformed;
                    const debugInfo = options.debug
                        ? {
                            path: filePath,
                            hash: hex,
                            ...(isTransformed ? { isTransformed } : undefined),
                        }
                        : undefined;
                    resolve({
                        type: 'file',
                        id: filePath,
                        hex,
                        ...(debugInfo ? { debugInfo } : undefined),
                    });
                    resolved = true;
                }
            });
            stream.on('error', (e) => {
                reject(e);
            });
            stream.on('data', (chunk) => {
                hasher.update(chunk);
            });
        });
    });
}
/**
 * Create `HashResult` for a dir.
 * If the dir is excluded, returns null rather than a HashResult
 */
async function createDirHashResultsAsync(dirPath, limiter, projectRoot, options, depth = 0) {
    // Using `ignoreDirMatchObjects` as an optimization to skip the whole directory
    if ((0, Path_1.isIgnoredPathWithMatchObjects)(dirPath, options.ignoreDirMatchObjects)) {
        return null;
    }
    const dirents = (await promises_1.default.readdir(path_1.default.join(projectRoot, dirPath), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    const results = (await Promise.all(dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
            const filePath = (0, Path_1.toPosixPath)(path_1.default.join(dirPath, dirent.name));
            return await createDirHashResultsAsync(filePath, limiter, projectRoot, options, depth + 1);
        }
        else if (dirent.isFile()) {
            const filePath = (0, Path_1.toPosixPath)(path_1.default.join(dirPath, dirent.name));
            return await createFileHashResultsAsync(filePath, limiter, projectRoot, options);
        }
        return null;
    }))).filter(Predicates_1.nonNullish);
    if (results.length === 0) {
        return null;
    }
    const hasher = (0, crypto_1.createHash)(options.hashAlgorithm);
    const children = [];
    for (const result of results) {
        hasher.update(result.id);
        hasher.update(result.hex);
        children.push(result.debugInfo);
    }
    const hex = hasher.digest('hex');
    return {
        type: 'dir',
        id: dirPath,
        hex,
        ...(options.debug ? { debugInfo: { path: dirPath, children, hash: hex } } : undefined),
    };
}
/**
 * Create `HashResult` for a `HashSourceContents`
 */
async function createContentsHashResultsAsync(source, options) {
    let isTransformed = undefined;
    if (options.fileHookTransform) {
        const transformedContents = options.fileHookTransform({
            type: 'contents',
            id: source.id,
        }, source.contents, true /* isEndOfFile */, 'utf8') ?? '';
        if (options.debug) {
            isTransformed = transformedContents !== source.contents;
        }
        source.contents = transformedContents;
    }
    const hex = (0, crypto_1.createHash)(options.hashAlgorithm).update(source.contents).digest('hex');
    const debugInfo = options.debug
        ? {
            hash: hex,
            ...(isTransformed ? { isTransformed } : undefined),
        }
        : undefined;
    return {
        type: 'contents',
        id: source.id,
        hex,
        ...(debugInfo ? { debugInfo } : undefined),
    };
}
/**
 * Create id from given source
 */
function createSourceId(source) {
    switch (source.type) {
        case 'contents':
            return source.id;
        case 'file':
            return source.filePath;
        case 'dir':
            return source.filePath;
        default:
            throw new Error('Unsupported source type');
    }
}
//# sourceMappingURL=Hash.js.map