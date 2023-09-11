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
 * Differentiate two fingerprints
 */
function diffFingerprints(fingerprint1, fingerprint2) {
    return fingerprint2.sources.filter((newItem) => {
        return !fingerprint1.sources.find((item) => item.type === newItem.type && item.hash === newItem.hash);
    });
}
exports.diffFingerprints = diffFingerprints;
//# sourceMappingURL=Fingerprint.js.map