"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToPbxProjectSection = addToPbxProjectSection;
function addToPbxProjectSection(xcodeProject, target) {
    xcodeProject.addToPbxProjectSection(target);
    const pbxProjectSection = xcodeProject.pbxProjectSection();
    const project = pbxProjectSection[xcodeProject.getFirstProject().uuid];
    // Add target attributes to project section
    if (!project.attributes.TargetAttributes) {
        project.attributes.TargetAttributes = {};
    }
    project.attributes.TargetAttributes[target.uuid] = {
        LastSwiftMigration: 1250,
    };
}
