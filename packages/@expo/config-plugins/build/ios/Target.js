"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TargetType = void 0;
exports.findApplicationTargetWithDependenciesAsync = findApplicationTargetWithDependenciesAsync;
exports.findFirstNativeTarget = findFirstNativeTarget;
exports.findNativeTargetByName = findNativeTargetByName;
exports.findSignableTargets = findSignableTargets;
exports.getNativeTargets = getNativeTargets;
exports.getXCBuildConfigurationFromPbxproj = getXCBuildConfigurationFromPbxproj;
exports.isTargetOfType = isTargetOfType;
function _BuildScheme() {
  const data = require("./BuildScheme");
  _BuildScheme = function () {
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
function _string() {
  const data = require("./utils/string");
  _string = function () {
    return data;
  };
  return data;
}
let TargetType;
exports.TargetType = TargetType;
(function (TargetType) {
  TargetType["APPLICATION"] = "com.apple.product-type.application";
  TargetType["EXTENSION"] = "com.apple.product-type.app-extension";
  TargetType["WATCH"] = "com.apple.product-type.application.watchapp";
  TargetType["APP_CLIP"] = "com.apple.product-type.application.on-demand-install-capable";
  TargetType["STICKER_PACK_EXTENSION"] = "com.apple.product-type.app-extension.messages-sticker-pack";
  TargetType["FRAMEWORK"] = "com.apple.product-type.framework";
  TargetType["OTHER"] = "other";
})(TargetType || (exports.TargetType = TargetType = {}));
function getXCBuildConfigurationFromPbxproj(project, {
  targetName,
  buildConfiguration = 'Release'
} = {}) {
  const [, nativeTarget] = targetName ? findNativeTargetByName(project, targetName) : findFirstNativeTarget(project);
  const [, xcBuildConfiguration] = (0, _Xcodeproj().getBuildConfigurationForListIdAndName)(project, {
    configurationListId: nativeTarget.buildConfigurationList,
    buildConfiguration
  });
  return xcBuildConfiguration !== null && xcBuildConfiguration !== void 0 ? xcBuildConfiguration : null;
}
async function findApplicationTargetWithDependenciesAsync(projectRoot, scheme) {
  const applicationTargetName = await (0, _BuildScheme().getApplicationTargetNameForSchemeAsync)(projectRoot, scheme);
  const project = (0, _Xcodeproj().getPbxproj)(projectRoot);
  const [, applicationTarget] = findNativeTargetByName(project, applicationTargetName);
  const dependencies = getTargetDependencies(project, applicationTarget);
  return {
    name: (0, _string().trimQuotes)(applicationTarget.name),
    type: TargetType.APPLICATION,
    signable: true,
    dependencies
  };
}
function getTargetDependencies(project, parentTarget) {
  if (!parentTarget.dependencies || parentTarget.dependencies.length === 0) {
    return undefined;
  }
  const nonSignableTargetTypes = [TargetType.FRAMEWORK];
  return parentTarget.dependencies.map(({
    value
  }) => {
    const {
      target: targetId
    } = project.getPBXGroupByKeyAndType(value, 'PBXTargetDependency');
    const [, target] = findNativeTargetById(project, targetId);
    const type = isTargetOfType(target, TargetType.EXTENSION) ? TargetType.EXTENSION : TargetType.OTHER;
    return {
      name: (0, _string().trimQuotes)(target.name),
      type,
      signable: !nonSignableTargetTypes.some(signableTargetType => isTargetOfType(target, signableTargetType)),
      dependencies: getTargetDependencies(project, target)
    };
  });
}
function isTargetOfType(target, targetType) {
  return (0, _string().trimQuotes)(target.productType) === targetType;
}
function getNativeTargets(project) {
  const section = project.pbxNativeTargetSection();
  return Object.entries(section).filter(_Xcodeproj().isNotComment);
}
function findSignableTargets(project) {
  const targets = getNativeTargets(project);
  const signableTargetTypes = [TargetType.APPLICATION, TargetType.APP_CLIP, TargetType.EXTENSION, TargetType.WATCH, TargetType.STICKER_PACK_EXTENSION];
  const applicationTargets = targets.filter(([, target]) => {
    for (const targetType of signableTargetTypes) {
      if (isTargetOfType(target, targetType)) {
        return true;
      }
    }
    return false;
  });
  if (applicationTargets.length === 0) {
    throw new Error(`Could not find any signable targets in project.pbxproj`);
  }
  return applicationTargets;
}
function findFirstNativeTarget(project) {
  const targets = getNativeTargets(project);
  const applicationTargets = targets.filter(([, target]) => isTargetOfType(target, TargetType.APPLICATION));
  if (applicationTargets.length === 0) {
    throw new Error(`Could not find any application target in project.pbxproj`);
  }
  return applicationTargets[0];
}
function findNativeTargetByName(project, targetName) {
  const nativeTargets = getNativeTargets(project);
  const nativeTargetEntry = nativeTargets.find(([, i]) => (0, _string().trimQuotes)(i.name) === targetName);
  if (!nativeTargetEntry) {
    throw new Error(`Could not find target '${targetName}' in project.pbxproj`);
  }
  return nativeTargetEntry;
}
function findNativeTargetById(project, targetId) {
  const nativeTargets = getNativeTargets(project);
  const nativeTargetEntry = nativeTargets.find(([key]) => key === targetId);
  if (!nativeTargetEntry) {
    throw new Error(`Could not find target with id '${targetId}' in project.pbxproj`);
  }
  return nativeTargetEntry;
}
//# sourceMappingURL=Target.js.map