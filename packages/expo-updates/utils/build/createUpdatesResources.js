"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const createFingerprintForBuildAsync_1 = require("./createFingerprintForBuildAsync");
const createManifestForBuildAsync_1 = require("./createManifestForBuildAsync");
const findUpProjectRoot_1 = require("./findUpProjectRoot");
(async function () {
    const platform = process.argv[2];
    if (!['ios', 'android'].includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    const projectRootArg = process.argv[3];
    (0, assert_1.default)(projectRootArg, 'Must provide a valid project root');
    const possibleProjectRoot = (0, findUpProjectRoot_1.findUpProjectRoot)(projectRootArg);
    (0, assert_1.default)(possibleProjectRoot, 'Must provide a valid project root');
    const destinationDir = process.argv[4];
    (0, assert_1.default)(destinationDir, 'Must provide a valid destination directory');
    const createUpdatesResourcesMode = process.argv[5];
    if (!['all', 'only-fingerprint'].includes(createUpdatesResourcesMode)) {
        throw new Error(`Unsupported createUpdatesResourcesMode: ${createUpdatesResourcesMode}`);
    }
    const entryFileArg = process.argv[6];
    await Promise.all([
        createUpdatesResourcesMode === 'all'
            ? (0, createManifestForBuildAsync_1.createManifestForBuildAsync)(platform, possibleProjectRoot, destinationDir, entryFileArg)
            : null,
        (0, createFingerprintForBuildAsync_1.createFingerprintForBuildAsync)(platform, possibleProjectRoot, destinationDir),
    ]);
})().catch((e) => {
    // Wrap in regex to make it easier for log parsers (like `@expo/xcpretty`) to find this error.
    e.message = `@build-script-error-begin\n${e.message}\n@build-script-error-end\n`;
    console.error(e);
    process.exit(1);
});
