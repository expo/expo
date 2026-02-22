"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToPbxProjectSection = addToPbxProjectSection;
function addToPbxProjectSection(xcodeProject, target) {
    xcodeProject.addToPbxProjectSection(target);
    const projectUuid = xcodeProject.getFirstProject().uuid;
    const projectSection = xcodeProject.pbxProjectSection()[projectUuid];
    if (!projectSection.attributes.TargetAttributes) {
        projectSection.attributes.TargetAttributes = {};
    }
    projectSection.attributes.TargetAttributes[target.uuid] = {
        LastSwiftMigration: 1250, // Adds the Swift 5.0 target migration attribute to avoid "Convert to Current Swift Syntax" warning
        ProvisioningStyle: 'Automatic', // Uses "Automatically manage signing" by default
        CreatedOnToolsVersion: '15.1',
    };
}
