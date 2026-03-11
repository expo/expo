"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTargetDependency = addTargetDependency;
function addTargetDependency(xcodeProject, target) {
    if (!xcodeProject.hash.project.objects['PBXTargetDependency']) {
        xcodeProject.hash.project.objects['PBXTargetDependency'] = {};
    }
    if (!xcodeProject.hash.project.objects['PBXContainerItemProxy']) {
        xcodeProject.hash.project.objects['PBXContainerItemProxy'] = {};
    }
    xcodeProject.addTargetDependency(xcodeProject.getFirstTarget().uuid, [target.uuid]);
}
