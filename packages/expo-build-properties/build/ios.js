"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosDeploymentTarget = exports.withIosBuildProperties = void 0;
const config_plugins_1 = require("expo/config-plugins");
const { createBuildPodfilePropsConfigPlugin } = config_plugins_1.IOSConfig.BuildProperties;
exports.withIosBuildProperties = createBuildPodfilePropsConfigPlugin([
    {
        propName: 'ios.useFrameworks',
        propValueGetter: (config) => config.ios?.useFrameworks,
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, configurations] of config_plugins_1.IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project, buildConfigListId)) {
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
