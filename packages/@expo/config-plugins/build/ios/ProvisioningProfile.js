"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setProvisioningProfileForPbxproj = setProvisioningProfileForPbxproj;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function setProvisioningProfileForPbxproj(projectRoot, {
  targetName,
  profileName,
  appleTeamId,
  buildConfiguration = 'Release'
}) {
  const project = (0, _Xcodeproj().getPbxproj)(projectRoot);
  const nativeTargetEntry = targetName ? (0, _Target().findNativeTargetByName)(project, targetName) : (0, _Target().findFirstNativeTarget)(project);
  const [nativeTargetId, nativeTarget] = nativeTargetEntry;
  const quotedAppleTeamId = ensureQuotes(appleTeamId);
  (0, _Xcodeproj().getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList).filter(([, item]) => (0, _string().trimQuotes)(item.name) === buildConfiguration).forEach(([, item]) => {
    item.buildSettings.PROVISIONING_PROFILE_SPECIFIER = `"${profileName}"`;
    item.buildSettings.DEVELOPMENT_TEAM = quotedAppleTeamId;
    item.buildSettings.CODE_SIGN_IDENTITY = '"iPhone Distribution"';
    item.buildSettings.CODE_SIGN_STYLE = 'Manual';
  });
  Object.entries((0, _Xcodeproj().getProjectSection)(project)).filter(_Xcodeproj().isNotComment).forEach(([, item]) => {
    if (!item.attributes.TargetAttributes[nativeTargetId]) {
      item.attributes.TargetAttributes[nativeTargetId] = {};
    }
    item.attributes.TargetAttributes[nativeTargetId].DevelopmentTeam = quotedAppleTeamId;
    item.attributes.TargetAttributes[nativeTargetId].ProvisioningStyle = 'Manual';
  });
  _fs().default.writeFileSync(project.filepath, project.writeSync());
}
const ensureQuotes = value => {
  if (!value.match(/^['"]/)) {
    return `"${value}"`;
  }
  return value;
};
//# sourceMappingURL=ProvisioningProfile.js.map