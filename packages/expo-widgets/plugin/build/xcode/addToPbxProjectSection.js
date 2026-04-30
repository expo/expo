"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToPbxProjectSection = addToPbxProjectSection;
function addToPbxProjectSection(xcodeProject, target) {
    const pbxProjectSection = xcodeProject.pbxProjectSection();
    const project = pbxProjectSection[xcodeProject.getFirstProject().uuid];
    const targetAlreadyAdded = project.targets.some((projectTarget) => projectTarget.value === target.uuid);
    if (targetAlreadyAdded) {
        return;
    }
    xcodeProject.addToPbxProjectSection(target);
    // Add target attributes to project section
    if (!project.attributes.TargetAttributes) {
        project.attributes.TargetAttributes = {};
    }
    project.attributes.TargetAttributes[target.uuid] = {
        LastSwiftMigration: 1250,
    };
}
