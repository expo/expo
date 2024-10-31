#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function readFingerprintFile(path) {
    try {
        return JSON.parse(fs_1.default.readFileSync(path, 'utf-8'));
    }
    catch (e) {
        console.log(`Unable to read fingerprint file ${path}: ${e.message}`);
        process.exit(1);
    }
}
(async () => {
    const Fingerprint = await import('../../build/index.js');
    if (process.argv.length !== 3 && process.argv.length !== 4 && process.argv.length !== 5) {
        console.log(`Usage: ${path_1.default.basename(process.argv[1])} projectRoot [fingerprintFile1ToDiff] [fingerprintFile2ToDiff]`);
        process.exit(1);
    }
    const projectRoot = process.argv[2];
    const fingerprintFile1ToDiff = process.argv[3];
    const fingerprintFile2ToDiff = process.argv[4];
    const fingeprint1ToDiff = fingerprintFile1ToDiff
        ? readFingerprintFile(fingerprintFile1ToDiff)
        : undefined;
    const fingeprint2ToDiff = fingerprintFile2ToDiff
        ? readFingerprintFile(fingerprintFile2ToDiff)
        : undefined;
    const options = {
        debug: !!process.env.DEBUG,
        useRNCoreAutolinkingFromExpo: process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO
            ? ['1', 'true'].includes(process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO)
            : undefined,
    };
    try {
        if (fingeprint1ToDiff && fingeprint2ToDiff) {
            const diff = Fingerprint.diffFingerprints(fingeprint1ToDiff, fingeprint2ToDiff);
            console.log(JSON.stringify(diff, null, 2));
        }
        else if (fingeprint1ToDiff) {
            const diff = await Fingerprint.diffFingerprintChangesAsync(fingeprint1ToDiff, projectRoot, options);
            console.log(JSON.stringify(diff, null, 2));
        }
        else {
            const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot, options);
            console.log(JSON.stringify(fingerprint, null, 2));
        }
    }
    catch (e) {
        console.error('Uncaught Error', e);
        process.exit(1);
    }
})();
