"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFingerprintForBuildAsync = createFingerprintForBuildAsync;
const config_1 = require("expo/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createFingerprintAsync_1 = require("./createFingerprintAsync");
const workflow_1 = require("./workflow");
async function createFingerprintForBuildAsync(platform, possibleProjectRoot, destinationDir) {
    // Remove projectRoot validation when we no longer support React Native <= 62
    let projectRoot;
    if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, 'package.json'))) {
        projectRoot = possibleProjectRoot;
    }
    else if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, '..', 'package.json'))) {
        projectRoot = path_1.default.resolve(possibleProjectRoot, '..');
    }
    else {
        throw new Error('Error loading app package. Ensure there is a package.json in your app.');
    }
    process.chdir(projectRoot);
    const { exp: config } = (0, config_1.getConfig)(projectRoot, {
        isPublicConfig: true,
        skipSDKVersionRequirement: true,
    });
    const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
    if (!runtimeVersion || typeof runtimeVersion === 'string') {
        // normal runtime versions don't need fingerprinting
        return;
    }
    if (runtimeVersion.policy !== 'fingerprint') {
        // not a policy that needs fingerprinting
        return;
    }
    let fingerprint;
    const fingerprintOverride = process.env.EXPO_UPDATES_FINGERPRINT_OVERRIDE;
    if (fingerprintOverride) {
        console.log(`Using fingerprint from EXPO_UPDATES_FINGERPRINT_OVERRIDE: ${fingerprintOverride}`);
        fingerprint = { hash: fingerprintOverride };
    }
    else {
        const workflowOverride = process.env.EXPO_UPDATES_WORKFLOW_OVERRIDE;
        const workflow = workflowOverride
            ? (0, workflow_1.validateWorkflow)(workflowOverride)
            : await (0, workflow_1.resolveWorkflowAsync)(projectRoot, platform);
        const createdFingerprint = await (0, createFingerprintAsync_1.createFingerprintAsync)(projectRoot, platform, workflow, {});
        console.log(JSON.stringify(createdFingerprint));
        fingerprint = createdFingerprint;
    }
    fs_1.default.writeFileSync(path_1.default.join(destinationDir, 'fingerprint'), fingerprint.hash);
}
