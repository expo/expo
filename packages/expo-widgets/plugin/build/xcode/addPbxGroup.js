"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPbxGroup = addPbxGroup;
function addPbxGroup(xcodeProject, { targetName, widgetFiles, }) {
    // Add PBX group
    const { uuid: pbxGroupUuid } = xcodeProject.addPbxGroup([...widgetFiles, `${targetName}.entitlements`], targetName, targetName);
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
