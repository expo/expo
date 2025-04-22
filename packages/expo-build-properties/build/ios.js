"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosDeploymentTarget = exports.withIosBuildProperties = void 0;
const config_plugins_1 = require("expo/config-plugins");
const { createBuildPodfilePropsConfigPlugin } = config_plugins_1.IOSConfig.BuildProperties;
exports.withIosBuildProperties = createBuildPodfilePropsConfigPlugin([
    {
        propName: 'newArchEnabled',
        propValueGetter: (config) => {
            if (config.ios?.newArchEnabled !== undefined) {
                config_plugins_1.WarningAggregator.addWarningIOS('withIosBuildProperties', 'ios.newArchEnabled is deprecated, use app config `newArchEnabled` instead.', 'https://docs.expo.dev/versions/latest/config/app/#newarchenabled');
            }
            return config.ios?.newArchEnabled?.toString();
        },
    },
    {
        propName: 'ios.useFrameworks',
        propValueGetter: (config) => config.ios?.useFrameworks,
    },
    {
        propName: 'EX_DEV_CLIENT_NETWORK_INSPECTOR',
        propValueGetter: (config) => (config.ios?.networkInspector ?? true).toString(),
    },
    {
        propName: 'apple.extraPods',
        propValueGetter: (config) => {
            const extraPods = config.ios?.extraPods ?? [];
            return extraPods.length > 0 ? JSON.stringify(extraPods) : undefined;
        },
    },
    {
        propName: 'apple.ccacheEnabled',
        propValueGetter: (config) => config.ios?.ccacheEnabled?.toString(),
    },
    {
        propName: 'apple.privacyManifestAggregationEnabled',
        propValueGetter: (config) => (config.ios?.privacyManifestAggregationEnabled ?? true).toString(),
    },
], 'withIosBuildProperties');
const withIosDeploymentTarget = (config, props) => {
    const deploymentTarget = props.ios?.deploymentTarget;
    if (!deploymentTarget) {
        return config;
    }
    // Updates deployment target in app xcodeproj
    config = withIosDeploymentTargetXcodeProject(config, { deploymentTarget });
    // Updates deployement target in Podfile (Pods project)
    config = withIosDeploymentTargetPodfile(config, props);
    return config;
};
exports.withIosDeploymentTarget = withIosDeploymentTarget;
const withIosDeploymentTargetXcodeProject = (config, props) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        config.modResults = updateDeploymentTargetXcodeProject(config.modResults, props.deploymentTarget);
        return config;
    });
};
function updateDeploymentTargetXcodeProject(project, deploymentTarget) {
    const { Target } = config_plugins_1.IOSConfig;
    const targetBuildConfigListIds = Target.getNativeTargets(project)
        .filter(([_, target]) => Target.isTargetOfType(target, Target.TargetType.APPLICATION))
        .map(([_, target]) => target.buildConfigurationList);
    for (const buildConfigListId of targetBuildConfigListIds) {
        for (const [, configurations] of config_plugins_1.IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project, buildConfigListId)) {
            const { buildSettings } = configurations;
            if (buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
                buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
            }
        }
    }
    return project;
}
const withIosDeploymentTargetPodfile = createBuildPodfilePropsConfigPlugin([
    {
        propName: 'ios.deploymentTarget',
        propValueGetter: (config) => config.ios?.deploymentTarget,
    },
], 'withIosDeploymentTargetPodfile');
