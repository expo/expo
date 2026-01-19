import { XcodeProject } from 'expo/config-plugins';

export function addToPbxProjectSection(xcodeProject: XcodeProject, target: { uuid: string }) {
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
