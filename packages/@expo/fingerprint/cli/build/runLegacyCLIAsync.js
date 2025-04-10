"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLegacyCLIAsync = runLegacyCLIAsync;
const readFingerprintFileAsync_js_1 = __importDefault(require("./utils/readFingerprintFileAsync.js"));
const index_js_1 = require("../../build/index.js");
async function runLegacyCLIAsync(args) {
    if (args.length !== 1 && args.length !== 2 && args.length !== 3) {
        console.log(`Usage: npx @expo/fingerprint <projectRoot> [fingerprintFile1ToDiff] [fingerprintFile2ToDiff]`);
        process.exit(1);
    }
    const projectRoot = args[0];
    const fingerprintFile1ToDiff = args[1];
    const fingerprintFile2ToDiff = args[2];
    const [fingerprint1ToDiff, fingerprint2ToDiff] = await Promise.all([
        fingerprintFile1ToDiff ? (0, readFingerprintFileAsync_js_1.default)(fingerprintFile1ToDiff) : null,
        fingerprintFile2ToDiff ? (0, readFingerprintFileAsync_js_1.default)(fingerprintFile2ToDiff) : null,
    ]);
    const options = {
        debug: !!process.env.DEBUG,
        useRNCoreAutolinkingFromExpo: process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO
            ? ['1', 'true'].includes(process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO)
            : undefined,
    };
    try {
        if (fingerprint1ToDiff && fingerprint2ToDiff) {
            const diff = (0, index_js_1.diffFingerprints)(fingerprint1ToDiff, fingerprint2ToDiff);
            console.log(JSON.stringify(diff, null, 2));
        }
        else if (fingerprint1ToDiff) {
            const diff = await (0, index_js_1.diffFingerprintChangesAsync)(fingerprint1ToDiff, projectRoot, options);
            console.log(JSON.stringify(diff, null, 2));
        }
        else {
            const fingerprint = await (0, index_js_1.createFingerprintAsync)(projectRoot, options);
            console.log(JSON.stringify(fingerprint, null, 2));
        }
    }
    catch (e) {
        console.error('Uncaught Error', e);
        process.exit(1);
    }
}
