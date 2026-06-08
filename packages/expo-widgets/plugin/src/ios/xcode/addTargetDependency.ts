import { XcodeProject } from 'expo/config-plugins';

export function addTargetDependency(xcodeProject: XcodeProject, target: { uuid: string }) {
  const objects = xcodeProject.hash.project.objects as Record<string, Record<string, any>>;
  objects.PBXTargetDependency ??= {};
  objects.PBXContainerItemProxy ??= {};
  const targetDependencies = objects.PBXTargetDependency;

  const mainTargetUuid = xcodeProject.getFirstTarget().uuid;
  const mainTarget = xcodeProject.pbxNativeTargetSection()[mainTargetUuid];
  if (!mainTarget) {
    throw new Error(`Could not find main native target ${mainTargetUuid}`);
  }
  mainTarget.dependencies ??= [];

  if (
    mainTarget.dependencies.some(
      (dependency: { value: string }) => targetDependencies[dependency.value]?.target === target.uuid
    )
  ) {
    return;
  }

  xcodeProject.addTargetDependency(mainTargetUuid, [target.uuid]);
}
