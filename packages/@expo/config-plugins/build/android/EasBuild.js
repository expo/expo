"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEasBuildGradleConfiguredAsync = exports.configureEasBuildAsync = exports.getEasBuildGradlePath = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const EasBuildGradleScript_1 = __importDefault(require("./EasBuildGradleScript"));
const Paths = __importStar(require("./Paths"));
const APPLY_EAS_GRADLE = 'apply from: "./eas-build.gradle"';
function hasApplyLine(content, applyLine) {
    return (content
        .replace(/\r\n/g, '\n')
        .split('\n')
        // Check for both single and double quotes
        .some((line) => line === applyLine || line === applyLine.replace(/"/g, "'")));
}
function getEasBuildGradlePath(projectRoot) {
    return path_1.default.join(projectRoot, 'android', 'app', 'eas-build.gradle');
}
exports.getEasBuildGradlePath = getEasBuildGradlePath;
async function configureEasBuildAsync(projectRoot) {
    const buildGradlePath = Paths.getAppBuildGradleFilePath(projectRoot);
    const easGradlePath = getEasBuildGradlePath(projectRoot);
    await fs_1.default.promises.writeFile(easGradlePath, EasBuildGradleScript_1.default);
    const buildGradleContent = await fs_1.default.promises.readFile(path_1.default.join(buildGradlePath), 'utf8');
    const hasEasGradleApply = hasApplyLine(buildGradleContent, APPLY_EAS_GRADLE);
    if (!hasEasGradleApply) {
        await fs_1.default.promises.writeFile(buildGradlePath, `${buildGradleContent.trim()}\n${APPLY_EAS_GRADLE}\n`);
    }
}
exports.configureEasBuildAsync = configureEasBuildAsync;
async function isEasBuildGradleConfiguredAsync(projectRoot) {
    const buildGradlePath = Paths.getAppBuildGradleFilePath(projectRoot);
    const easGradlePath = getEasBuildGradlePath(projectRoot);
    const hasEasGradleFile = await fs_1.default.existsSync(easGradlePath);
    const buildGradleContent = await fs_1.default.promises.readFile(path_1.default.join(buildGradlePath), 'utf8');
    const hasEasGradleApply = hasApplyLine(buildGradleContent, APPLY_EAS_GRADLE);
    return hasEasGradleApply && hasEasGradleFile;
}
exports.isEasBuildGradleConfiguredAsync = isEasBuildGradleConfiguredAsync;
