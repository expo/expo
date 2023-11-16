"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchiveBuildConfigurationForSchemeAsync = exports.getApplicationTargetNameForSchemeAsync = exports.getRunnableSchemesFromXcodeproj = exports.getSchemesFromXcodeproj = void 0;
const Paths_1 = require("./Paths");
const Target_1 = require("./Target");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const XML_1 = require("../utils/XML");
function getSchemesFromXcodeproj(projectRoot) {
    return (0, Paths_1.findSchemeNames)(projectRoot);
}
exports.getSchemesFromXcodeproj = getSchemesFromXcodeproj;
function getRunnableSchemesFromXcodeproj(projectRoot, { configuration = 'Debug' } = {}) {
    const project = (0, Xcodeproj_1.getPbxproj)(projectRoot);
    return (0, Target_1.findSignableTargets)(project).map(([, target]) => {
        let osType = 'iOS';
        const type = (0, Xcodeproj_1.unquote)(target.productType);
        if (type === Target_1.TargetType.WATCH) {
            osType = 'watchOS';
        }
        else if (
        // (apps) com.apple.product-type.application
        // (app clips) com.apple.product-type.application.on-demand-install-capable
        // NOTE(EvanBacon): This matches against `watchOS` as well so we check for watch first.
        type.startsWith(Target_1.TargetType.APPLICATION)) {
            // Attempt to resolve the platform SDK for each target so we can filter devices.
            const xcConfigurationList = project.hash.project.objects.XCConfigurationList[target.buildConfigurationList];
            if (xcConfigurationList) {
                const buildConfiguration = xcConfigurationList.buildConfigurations.find((value) => value.comment === configuration) || xcConfigurationList.buildConfigurations[0];
                if (buildConfiguration?.value) {
                    const xcBuildConfiguration = project.hash.project.objects.XCBuildConfiguration?.[buildConfiguration.value];
                    const buildSdkRoot = xcBuildConfiguration.buildSettings.SDKROOT;
                    if (buildSdkRoot === 'appletvos' ||
                        'TVOS_DEPLOYMENT_TARGET' in xcBuildConfiguration.buildSettings) {
                        // Is a TV app...
                        osType = 'tvOS';
                    }
                    else if (buildSdkRoot === 'iphoneos') {
                        osType = 'iOS';
                    }
                }
            }
        }
        return {
            name: (0, Xcodeproj_1.unquote)(target.name),
            osType,
            type: (0, Xcodeproj_1.unquote)(target.productType),
        };
    });
}
exports.getRunnableSchemesFromXcodeproj = getRunnableSchemesFromXcodeproj;
async function readSchemeAsync(projectRoot, scheme) {
    const allSchemePaths = (0, Paths_1.findSchemePaths)(projectRoot);
    const re = new RegExp(`/${scheme}.xcscheme`, 'i');
    const schemePath = allSchemePaths.find((i) => re.exec(i));
    if (schemePath) {
        return (await (0, XML_1.readXMLAsync)({ path: schemePath }));
    }
    else {
        throw new Error(`scheme '${scheme}' does not exist, make sure it's marked as shared`);
    }
}
async function getApplicationTargetNameForSchemeAsync(projectRoot, scheme) {
    const schemeXML = await readSchemeAsync(projectRoot, scheme);
    const buildActionEntry = schemeXML?.Scheme?.BuildAction?.[0]?.BuildActionEntries?.[0]?.BuildActionEntry;
    const targetName = buildActionEntry?.length === 1
        ? getBlueprintName(buildActionEntry[0])
        : getBlueprintName(buildActionEntry?.find((entry) => {
            return entry.BuildableReference?.[0]?.['$']?.BuildableName?.endsWith('.app');
        }));
    if (!targetName) {
        throw new Error(`${scheme}.xcscheme seems to be corrupted`);
    }
    return targetName;
}
exports.getApplicationTargetNameForSchemeAsync = getApplicationTargetNameForSchemeAsync;
async function getArchiveBuildConfigurationForSchemeAsync(projectRoot, scheme) {
    const schemeXML = await readSchemeAsync(projectRoot, scheme);
    const buildConfiguration = schemeXML?.Scheme?.ArchiveAction?.[0]?.['$']?.buildConfiguration;
    if (!buildConfiguration) {
        throw new Error(`${scheme}.xcscheme seems to be corrupted`);
    }
    return buildConfiguration;
}
exports.getArchiveBuildConfigurationForSchemeAsync = getArchiveBuildConfigurationForSchemeAsync;
function getBlueprintName(entry) {
    return entry?.BuildableReference?.[0]?.['$']?.BlueprintName;
}
