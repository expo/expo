"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xcode_1 = require("xcode");
class PBXProject extends xcode_1.project {
    /**
     * @param filePath
     * @param param1.target PBXNativeTarget reference
     * @param param1.group PBXGroup reference
     */
    addStoryboardFile(filePath, { target, group }) {
        const file = this.addFile(filePath, undefined, {
            lastKnownFileType: 'file.storyboard',
            defaultEncoding: 4,
            target,
        });
        if (!file) {
            throw new Error('File already exists in the project');
        }
        delete this.pbxFileReferenceSection()[file.fileRef].explicitFileType;
        delete this.pbxFileReferenceSection()[file.fileRef].includeInIndex;
        file.uuid = this.generateUuid();
        file.target = target;
        this.addToPbxBuildFileSection(file);
        this.addToPbxResourcesBuildPhase(file);
        this.addToPbxGroup(file, group);
    }
}
exports.project = PBXProject;
//# sourceMappingURL=index.js.map