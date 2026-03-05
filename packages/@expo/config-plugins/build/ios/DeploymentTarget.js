"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDeploymentTarget = getDeploymentTarget;
exports.setDeploymentTargetForBuildConfiguration = setDeploymentTargetForBuildConfiguration;
exports.updateDeploymentTargetForPbxproj = updateDeploymentTargetForPbxproj;
exports.withDeploymentTargetPodfileProps = exports.withDeploymentTarget = void 0;
function _BuildProperties() {
  const data = require("./BuildProperties");
  _BuildProperties = function () {
    return data;
  };
  return data;
}
function _Target() {
  const data = require("./Target");
  _Target = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
/**
 * Set the iOS deployment target for all build configurations using all native targets.
 */
const withDeploymentTarget = config => {
  return (0, _iosPlugins().withXcodeProject)(config, config => {
    const deploymentTarget = getDeploymentTarget(config);
    if (deploymentTarget) {
      config.modResults = updateDeploymentTargetForPbxproj(config.modResults, deploymentTarget);
    }
    return config;
  });
};

/**
 * A config-plugin to update `ios/Podfile.properties.json` with the deployment target
 */
exports.withDeploymentTarget = withDeploymentTarget;
const withDeploymentTargetPodfileProps = exports.withDeploymentTargetPodfileProps = (0, _BuildProperties().createBuildPodfilePropsConfigPlugin)([{
  propName: 'ios.deploymentTarget',
  propValueGetter: config => config.ios?.deploymentTarget ?? null
}], 'withDeploymentTargetPodfileProps');

/** Get the iOS deployment target from Expo config, if defined */
function getDeploymentTarget(config) {
  return config.ios?.deploymentTarget ?? null;
}

/** Set the iOS deployment target for an XCBuildConfiguration object */
function setDeploymentTargetForBuildConfiguration(xcBuildConfiguration, deploymentTarget) {
  if (deploymentTarget) {
    xcBuildConfiguration.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
  }
}

/**
 * Update the iOS deployment target for all XCBuildConfiguration entries, in all native targets.
 */
function updateDeploymentTargetForPbxproj(project, deploymentTarget) {
  const nativeTargets = (0, _Target().getNativeTargets)(project);
  nativeTargets.forEach(([, nativeTarget]) => {
    (0, _Xcodeproj().getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList).forEach(([, buildConfig]) => setDeploymentTargetForBuildConfiguration(buildConfig, deploymentTarget));
  });
  return project;
}
//# sourceMappingURL=DeploymentTarget.js.map