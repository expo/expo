"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRuntimeVersionAsync = void 0;
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const createFingerprintAsync_1 = require("./createFingerprintAsync");
const workflow_1 = require("./workflow");
async function resolveRuntimeVersionAsync(projectRoot, platform) {
    const { exp: config } = (0, config_1.getConfig)(projectRoot, {
        isPublicConfig: true,
        skipSDKVersionRequirement: true,
    });
    const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
    if (!runtimeVersion || typeof runtimeVersion === 'string') {
        return runtimeVersion ?? null;
    }
    const workflow = await (0, workflow_1.resolveWorkflowAsync)(projectRoot, platform);
    const policy = runtimeVersion.policy;
    if (policy === 'fingerprintExperimental') {
        return (await (0, createFingerprintAsync_1.createFingerprintAsync)(projectRoot, platform, workflow)).hash;
    }
    if (workflow !== 'managed') {
        throw new Error(`You're currently using the bare workflow, where runtime version policies are not supported. You must set your runtime version manually. For example, define your runtime version as "1.0.0", not {"policy": "appVersion"} in your app config. https://docs.expo.dev/eas-update/runtime-versions`);
    }
    return await config_plugins_1.Updates.resolveRuntimeVersionPolicyAsync(policy, config, platform);
}
exports.resolveRuntimeVersionAsync = resolveRuntimeVersionAsync;
