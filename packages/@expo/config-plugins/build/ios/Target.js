"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNativeTargetByName = exports.findFirstNativeTarget = exports.findSignableTargets = exports.getNativeTargets = exports.isTargetOfType = exports.findApplicationTargetWithDependenciesAsync = exports.getXCBuildConfigurationFromPbxproj = exports.TargetType = void 0;
const BuildScheme_1 = require("./BuildScheme");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const string_1 = require("./utils/string");
var TargetType;
(function (TargetType) {
    TargetType["APPLICATION"] = "com.apple.product-type.application";
    TargetType["EXTENSION"] = "com.apple.product-type.app-extension";
    TargetType["WATCH"] = "com.apple.product-type.application.watchapp";
    TargetType["APP_CLIP"] = "com.apple.product-type.application.on-demand-install-capable";
    TargetType["STICKER_PACK_EXTENSION"] = "com.apple.product-type.app-extension.messages-sticker-pack";
    TargetType["FRAMEWORK"] = "com.apple.product-type.framework";
    TargetType["OTHER"] = "other";
})(TargetType || (exports.TargetType = TargetType = {}));
function getXCBuildConfigurationFromPbxproj(project, { targetName, buildConfiguration = 'Release', } = {}) {
    const [, nativeTarget] = targetName
        ? findNativeTargetByName(project, targetName)
        : findFirstNativeTarget(project);
    const [, xcBuildConfiguration] = (0, Xcodeproj_1.getBuildConfigurationForListIdAndName)(project, {
        configurationListId: nativeTarget.buildConfigurationList,
        buildConfiguration,
    });
    return xcBuildConfiguration ?? null;
}
exports.getXCBuildConfigurationFromPbxproj = getXCBuildConfigurationFromPbxproj;
async function findApplicationTargetWithDependenciesAsync(projectRoot, scheme) {
    const applicationTargetName = await (0, BuildScheme_1.getApplicationTargetNameForSchemeAsync)(projectRoot, scheme);
    const project = (0, Xcodeproj_1.getPbxproj)(projectRoot);
    const [, applicationTarget] = findNativeTargetByName(project, applicationTargetName);
    const dependencies = getTargetDependencies(project, applicationTarget);
    return {
        name: (0, string_1.trimQuotes)(applicationTarget.name),
        type: TargetType.APPLICATION,
        signable: true,
        dependencies,
    };
}
exports.findApplicationTargetWithDependenciesAsync = findApplicationTargetWithDependenciesAsync;
function getTargetDependencies(project, parentTarget) {
    if (!parentTarget.dependencies || parentTarget.dependencies.length === 0) {
        return undefined;
    }
    const nonSignableTargetTypes = [TargetType.FRAMEWORK];
    return parentTarget.dependencies.map(({ value }) => {
        const { target: targetId } = project.getPBXGroupByKeyAndType(value, 'PBXTargetDependency');
        const [, target] = findNativeTargetById(project, targetId);
        const type = isTargetOfType(target, TargetType.EXTENSION)
            ? TargetType.EXTENSION
            : TargetType.OTHER;
        return {
            name: (0, string_1.trimQuotes)(target.name),
            type,
            signable: !nonSignableTargetTypes.some((signableTargetType) => isTargetOfType(target, signableTargetType)),
            dependencies: getTargetDependencies(project, target),
        };
    });
}
function isTargetOfType(target, targetType) {
    return (0, string_1.trimQuotes)(target.productType) === targetType;
}
exports.isTargetOfType = isTargetOfType;
function getNativeTargets(project) {
    const section = project.pbxNativeTargetSection();
    return Object.entries(section).filter(Xcodeproj_1.isNotComment);
}
exports.getNativeTargets = getNativeTargets;
function findSignableTargets(project) {
    const targets = getNativeTargets(project);
    const signableTargetTypes = [
        TargetType.APPLICATION,
        TargetType.APP_CLIP,
        TargetType.EXTENSION,
        TargetType.WATCH,
        TargetType.STICKER_PACK_EXTENSION,
    ];
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
exports.findSignableTargets = findSignableTargets;
function findFirstNativeTarget(project) {
    const targets = getNativeTargets(project);
    const applicationTargets = targets.filter(([, target]) => isTargetOfType(target, TargetType.APPLICATION));
    if (applicationTargets.length === 0) {
        throw new Error(`Could not find any application target in project.pbxproj`);
    }
    return applicationTargets[0];
}
exports.findFirstNativeTarget = findFirstNativeTarget;
function findNativeTargetByName(project, targetName) {
    const nativeTargets = getNativeTargets(project);
    const nativeTargetEntry = nativeTargets.find(([, i]) => (0, string_1.trimQuotes)(i.name) === targetName);
    if (!nativeTargetEntry) {
        throw new Error(`Could not find target '${targetName}' in project.pbxproj`);
    }
    return nativeTargetEntry;
}
exports.findNativeTargetByName = findNativeTargetByName;
function findNativeTargetById(project, targetId) {
    const nativeTargets = getNativeTargets(project);
    const nativeTargetEntry = nativeTargets.find(([key]) => key === targetId);
    if (!nativeTargetEntry) {
        throw new Error(`Could not find target with id '${targetId}' in project.pbxproj`);
    }
    return nativeTargetEntry;
}
