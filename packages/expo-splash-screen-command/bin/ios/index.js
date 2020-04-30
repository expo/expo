"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const Assets_1 = __importDefault(require("./Assets"));
const Info_plist_1 = __importDefault(require("./Info.plist"));
const Storyboard_1 = __importDefault(require("./Storyboard"));
const pbxproj_1 = __importDefault(require("./pbxproj"));
async function configureIos(projectRootPath, { imagePath, resizeMode, backgroundColor, }) {
    const iosProject = await pbxproj_1.default(projectRootPath);
    await Promise.all([
        Info_plist_1.default(iosProject.projectPath),
        Assets_1.default(iosProject.projectPath, imagePath),
        Storyboard_1.default(iosProject, {
            resizeMode,
            backgroundColor,
            splashScreenImagePresent: !!imagePath,
        }),
    ]);
    await fs_extra_1.default.writeFile(iosProject.pbxProject.filepath, iosProject.pbxProject.writeSync());
}
exports.default = configureIos;
//# sourceMappingURL=index.js.map