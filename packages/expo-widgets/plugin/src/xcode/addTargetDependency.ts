import { XcodeProject } from 'expo/config-plugins';

export function addTargetDependency(xcodeProject: XcodeProject, target: { uuid: string }) {
  const { objects } = xcodeProject.hash.project;
  objects.PBXTargetDependency ??= {};
  objects.PBXContainerItemProxy ??= {};

  const mainTargetUuid = xcodeProject.getFirstTarget().uuid;
  const mainTarget = xcodeProject.pbxNativeTargetSection()[mainTargetUuid];
  mainTarget.dependencies ??= [];

  if (
    mainTarget.dependencies.some(
      (dependency: { value: string }) =>
        objects.PBXTargetDependency[dependency.value]?.target === target.uuid
    )
  ) {
    return;
  }

  xcodeProject.addTargetDependency(mainTargetUuid, [target.uuid]);
}
