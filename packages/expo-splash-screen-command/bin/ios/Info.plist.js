"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const StateManager_1 = __importDefault(require("../StateManager"));
const string_helpers_1 = require("../string-helpers");
const INFO_PLIST_FILE_PATH = 'Info.plist';
/**
 * Configures [INFO_PLIST] to show [STORYBOARD] filename as Splash/Launch Screen.
 */
async function configureInfoPlist(iosProjectPath) {
    const filePath = path_1.default.resolve(iosProjectPath, INFO_PLIST_FILE_PATH);
    const fileContent = await fs_extra_1.default.readFile(filePath, 'utf-8');
    const { state: newContent } = new StateManager_1.default(fileContent)
        .applyAction(content => {
        const [succeeded, newContent] = string_helpers_1.replace(content, {
            replaceContent: '<string>SplashScreen</string>',
            replacePattern: /(?<=<key>UILaunchStoryboardName<\/key>(.|\n)*?)<string>.*?<\/string>/m,
        });
        return [newContent, 'replaced', succeeded];
    })
        .applyAction((content, { replaced }) => {
        if (replaced) {
            return [content, 'inserted', false];
        }
        const [succeeded, newContent] = string_helpers_1.insert(content, {
            insertContent: `  <key>UILaunchStoryboardName</key>\n  <string>SplashScreen</string>\n`,
            insertPattern: /<\/dict>/gm,
        }, true);
        return [newContent, 'inserted', succeeded];
    });
    await fs_extra_1.default.writeFile(filePath, newContent);
}
exports.default = configureInfoPlist;
//# sourceMappingURL=Info.plist.js.map