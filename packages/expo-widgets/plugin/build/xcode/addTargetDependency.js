"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTargetDependency = addTargetDependency;
function addTargetDependency(xcodeProject, target) {
    const { objects } = xcodeProject.hash.project;
    objects.PBXTargetDependency ??= {};
    objects.PBXContainerItemProxy ??= {};
    const mainTargetUuid = xcodeProject.getFirstTarget().uuid;
    const mainTarget = xcodeProject.pbxNativeTargetSection()[mainTargetUuid];
    mainTarget.dependencies ??= [];
    if (mainTarget.dependencies.some((dependency) => objects.PBXTargetDependency[dependency.value]?.target === target.uuid)) {
        return;
    }
    xcodeProject.addTargetDependency(mainTargetUuid, [target.uuid]);
}
