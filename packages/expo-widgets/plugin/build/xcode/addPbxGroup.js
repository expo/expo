"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPbxGroup = addPbxGroup;
function addPbxGroup(xcodeProject, { targetName, widgetFiles, }) {
    if (xcodeProject.pbxGroupByName(targetName)) {
        return;
    }
    // Add PBX group
    const { uuid: pbxGroupUuid } = xcodeProject.addPbxGroup(Array.from(new Set([...widgetFiles, `${targetName}.entitlements`])), targetName, targetName);
    // Add PBXGroup to top level group
    const groups = xcodeProject.hash.project.objects['PBXGroup'];
    if (pbxGroupUuid) {
        Object.keys(groups).forEach(function (key) {
            if (groups[key].name === undefined && groups[key].path === undefined) {
                xcodeProject.addToPbxGroup(pbxGroupUuid, key);
            }
        });
    }
}
