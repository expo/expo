import { XcodeProject } from 'expo/config-plugins';

export function addTargetDependency(xcodeProject: XcodeProject, target: { uuid: string }) {
  if (!xcodeProject.hash.project.objects['PBXTargetDependency']) {
    xcodeProject.hash.project.objects['PBXTargetDependency'] = {};
  }
  // @ts-expect-error: TODO(@kitten): This was untyped before and is now failing
  xcodeProject.hash.project.objects['PBXContainerItemProxy'] ??= {};

  xcodeProject.addTargetDependency(xcodeProject.getFirstTarget().uuid, [target.uuid]);
}
