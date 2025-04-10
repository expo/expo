"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFingerprintAsync = createFingerprintAsync;
exports.createProjectHashAsync = createProjectHashAsync;
exports.diffFingerprintChangesAsync = diffFingerprintChangesAsync;
exports.diffFingerprints = diffFingerprints;
const Dedup_1 = require("./Dedup");
const Options_1 = require("./Options");
const Sort_1 = require("./Sort");
const Hash_1 = require("./hash/Hash");
const Sourcer_1 = require("./sourcer/Sourcer");
/**
 * Create a fingerprint for a project.
 * @example
 * ```js
 * const fingerprint = await createFingerprintAsync('/app');
 * console.log(fingerprint);
 * ```
 */
async function createFingerprintAsync(projectRoot, options) {
    const opts = await (0, Options_1.normalizeOptionsAsync)(projectRoot, options);
    const sources = await (0, Sourcer_1.getHashSourcesAsync)(projectRoot, opts);
    const normalizedSources = (0, Sort_1.sortSources)((0, Dedup_1.dedupSources)(sources, projectRoot));
    const fingerprint = await (0, Hash_1.createFingerprintFromSourcesAsync)(normalizedSources, projectRoot, opts);
    return fingerprint;
}
/**
 * Create a native hash value for a project.
 *
 * @example
 * ```ts
 * const hash = await createProjectHashAsync('/app');
 * console.log(hash);
 * ```
 */
async function createProjectHashAsync(projectRoot, options) {
    const fingerprint = await createFingerprintAsync(projectRoot, options);
    return fingerprint.hash;
}
/**
 * Diff the fingerprint with the fingerprint of the provided project.
 *
 * @example
 * ```ts
 * // Create a fingerprint for the project
 * const fingerprint = await createFingerprintAsync('/app');
 *
 * // Make some changes to the project
 *
 * // Calculate the diff
 * const diff = await diffFingerprintChangesAsync(fingerprint, '/app');
 * console.log(diff);
 * ```
 */
async function diffFingerprintChangesAsync(fingerprint, projectRoot, options) {
    const newFingerprint = await createFingerprintAsync(projectRoot, options);
    if (fingerprint.hash === newFingerprint.hash) {
        return [];
    }
    return diffFingerprints(fingerprint, newFingerprint);
}
/**
 * Diff two fingerprints. The implementation assumes that the sources are sorted.
 *
 * @example
 * ```ts
 * // Create a fingerprint for the project
 * const fingerprint = await createFingerprintAsync('/app');
 *
 * // Make some changes to the project
 *
 * // Create a fingerprint again
 * const fingerprint2 = await createFingerprintAsync('/app');
 * const diff = await diffFingerprints(fingerprint, fingerprint2);
 * console.log(diff);
 * ```
 */
function diffFingerprints(fingerprint1, fingerprint2) {
    let index1 = 0;
    let index2 = 0;
    const diff = [];
    while (index1 < fingerprint1.sources.length && index2 < fingerprint2.sources.length) {
        const source1 = fingerprint1.sources[index1];
        const source2 = fingerprint2.sources[index2];
        const compareResult = (0, Sort_1.compareSource)(source1, source2);
        if (compareResult === 0) {
            if (source1.hash !== source2.hash) {
                diff.push({ op: 'changed', beforeSource: source1, afterSource: source2 });
            }
            ++index1;
            ++index2;
        }
        else if (compareResult < 0) {
            diff.push({ op: 'removed', removedSource: source1 });
            ++index1;
        }
        else {
            diff.push({ op: 'added', addedSource: source2 });
            ++index2;
        }
    }
    while (index1 < fingerprint1.sources.length) {
        diff.push({ op: 'removed', removedSource: fingerprint1.sources[index1] });
        ++index1;
    }
    while (index2 < fingerprint2.sources.length) {
        diff.push({ op: 'added', addedSource: fingerprint2.sources[index2] });
        ++index2;
    }
    return diff;
}
//# sourceMappingURL=Fingerprint.js.map