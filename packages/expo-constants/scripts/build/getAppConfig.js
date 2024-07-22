"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@expo/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const possibleProjectRoot = process.argv[2];
const destinationDir = process.argv[3];
// TODO: Verify we can remove projectRoot validation, now that we no longer
// support React Native <= 62
let projectRoot;
if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, 'package.json'))) {
    projectRoot = possibleProjectRoot;
}
else if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, '..', 'package.json'))) {
    projectRoot = path_1.default.resolve(possibleProjectRoot, '..');
}
else {
    throw new Error(`Unable to locate project (no package.json found) at path: ${possibleProjectRoot}`);
}
require('@expo/env').load(projectRoot);
process.chdir(projectRoot);
const { exp } = (0, config_1.getConfig)(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
});
fs_1.default.writeFileSync(path_1.default.join(destinationDir, 'app.config'), JSON.stringify(exp));
