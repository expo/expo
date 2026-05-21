import { XcodeProject } from 'expo/config-plugins';

export function addToPbxProjectSection(xcodeProject: XcodeProject, target: { uuid: string }) {
  const pbxProjectSection = xcodeProject.pbxProjectSection();
  const project = pbxProjectSection[xcodeProject.getFirstProject().uuid];
  const targetAlreadyAdded = project.targets.some(
    (projectTarget: { value: string }) => projectTarget.value === target.uuid
  );
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
