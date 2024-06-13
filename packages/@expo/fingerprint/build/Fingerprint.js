"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffFingerprints = exports.diffFingerprintChangesAsync = exports.createProjectHashAsync = exports.createFingerprintAsync = void 0;
const Dedup_1 = require("./Dedup");
const Options_1 = require("./Options");
const Sort_1 = require("./Sort");
const Hash_1 = require("./hash/Hash");
const Sourcer_1 = require("./sourcer/Sourcer");
/**
 * Create a fingerprint from project
 */
async function createFingerprintAsync(projectRoot, options) {
    const opts = await (0, Options_1.normalizeOptionsAsync)(projectRoot, options);
    const sources = await (0, Sourcer_1.getHashSourcesAsync)(projectRoot, opts);
    const normalizedSources = (0, Sort_1.sortSources)((0, Dedup_1.dedupSources)(sources, projectRoot));
    const fingerprint = await (0, Hash_1.createFingerprintFromSourcesAsync)(normalizedSources, projectRoot, opts);
    return fingerprint;
}
exports.createFingerprintAsync = createFingerprintAsync;
/**
 * Create a native hash value from project
 */
async function createProjectHashAsync(projectRoot, options) {
    const fingerprint = await createFingerprintAsync(projectRoot, options);
    return fingerprint.hash;
}
exports.createProjectHashAsync = createProjectHashAsync;
/**
 * Differentiate given `fingerprint` with the current project fingerprint state
 */
async function diffFingerprintChangesAsync(fingerprint, projectRoot, options) {
    const newFingerprint = await createFingerprintAsync(projectRoot, options);
    if (fingerprint.hash === newFingerprint.hash) {
        return [];
    }
    return diffFingerprints(fingerprint, newFingerprint);
}
exports.diffFingerprintChangesAsync = diffFingerprintChangesAsync;
/**
 * Differentiate two fingerprints with operation type.
 * The implementation is assumed that the sources are sorted.
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
                diff.push({ op: 'changed', source: source2 });
            }
            ++index1;
            ++index2;
        }
        else if (compareResult < 0) {
            diff.push({ op: 'removed', source: source1 });
            ++index1;
        }
        else {
            diff.push({ op: 'added', source: source2 });
            ++index2;
        }
    }
    while (index1 < fingerprint1.sources.length) {
        diff.push({ op: 'removed', source: fingerprint1.sources[index1] });
        ++index1;
    }
    while (index2 < fingerprint2.sources.length) {
        diff.push({ op: 'added', source: fingerprint2.sources[index2] });
        ++index2;
    }
    return diff;
}
exports.diffFingerprints = diffFingerprints;
//# sourceMappingURL=Fingerprint.js.map