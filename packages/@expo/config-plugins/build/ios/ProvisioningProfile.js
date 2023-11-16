"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProvisioningProfileForPbxproj = void 0;
const fs_1 = __importDefault(require("fs"));
const Target_1 = require("./Target");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const string_1 = require("./utils/string");
function setProvisioningProfileForPbxproj(projectRoot, { targetName, profileName, appleTeamId, buildConfiguration = 'Release', }) {
    const project = (0, Xcodeproj_1.getPbxproj)(projectRoot);
    const nativeTargetEntry = targetName
        ? (0, Target_1.findNativeTargetByName)(project, targetName)
        : (0, Target_1.findFirstNativeTarget)(project);
    const [nativeTargetId, nativeTarget] = nativeTargetEntry;
    const quotedAppleTeamId = ensureQuotes(appleTeamId);
    (0, Xcodeproj_1.getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList)
        .filter(([, item]) => (0, string_1.trimQuotes)(item.name) === buildConfiguration)
        .forEach(([, item]) => {
        item.buildSettings.PROVISIONING_PROFILE_SPECIFIER = `"${profileName}"`;
        item.buildSettings.DEVELOPMENT_TEAM = quotedAppleTeamId;
        item.buildSettings.CODE_SIGN_IDENTITY = '"iPhone Distribution"';
        item.buildSettings.CODE_SIGN_STYLE = 'Manual';
    });
    Object.entries((0, Xcodeproj_1.getProjectSection)(project))
        .filter(Xcodeproj_1.isNotComment)
        .forEach(([, item]) => {
        if (!item.attributes.TargetAttributes[nativeTargetId]) {
            item.attributes.TargetAttributes[nativeTargetId] = {};
        }
        item.attributes.TargetAttributes[nativeTargetId].DevelopmentTeam = quotedAppleTeamId;
        item.attributes.TargetAttributes[nativeTargetId].ProvisioningStyle = 'Manual';
    });
    fs_1.default.writeFileSync(project.filepath, project.writeSync());
}
exports.setProvisioningProfileForPbxproj = setProvisioningProfileForPbxproj;
const ensureQuotes = (value) => {
    if (!value.match(/^['"]/)) {
        return `"${value}"`;
    }
    return value;
};
