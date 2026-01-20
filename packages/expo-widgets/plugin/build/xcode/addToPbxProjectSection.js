"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToPbxProjectSection = addToPbxProjectSection;
function addToPbxProjectSection(xcodeProject, target) {
    xcodeProject.addToPbxProjectSection(target);
    // Add target attributes to project section
    if (!xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid].attributes
        .TargetAttributes) {
        xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid].attributes.TargetAttributes = {};
    }
    xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid].attributes.TargetAttributes[target.uuid] = {
        LastSwiftMigration: 1250,
    };
}
