"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoriesFile = exports.getStoriesCacheDir = exports.getStories = exports.getStoryManifest = exports.getManifestFilePath = exports.mergeConfigs = exports.defaultConfig = exports.STORY_CACHE_DIR = void 0;
var path_1 = __importDefault(require("path"));
exports.STORY_CACHE_DIR = '__generated__/stories';
exports.defaultConfig = {
    projectRoot: process.cwd(),
    watchRoot: process.cwd(),
    // eslint-disable-next-line
    port: parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '7001'),
};
function mergeConfigs(serverConfig) {
    var _a;
    var config = __assign(__assign({}, exports.defaultConfig), serverConfig);
    var pathToPackageJson = path_1.default.resolve(config.projectRoot, 'package.json');
    var packageJson = require(pathToPackageJson);
    var packageJsonConfig = (_a = packageJson.expoStories) !== null && _a !== void 0 ? _a : {};
    config = __assign(__assign({}, config), packageJsonConfig);
    return config;
}
exports.mergeConfigs = mergeConfigs;
function getManifestFilePath(config) {
    var manifestFilePath = path_1.default.resolve(config.projectRoot, exports.STORY_CACHE_DIR, 'storyManifest.json');
    return manifestFilePath;
}
exports.getManifestFilePath = getManifestFilePath;
function getStoryManifest(config) {
    var manifestFilePath = getManifestFilePath(config);
    var storyManifest = require(manifestFilePath);
    return storyManifest;
}
exports.getStoryManifest = getStoryManifest;
function getStories(config) {
    var storyManifest = getStoryManifest(config);
    var stories = Object.keys(storyManifest.files).map(function (key) {
        return storyManifest.files[key];
    });
    return stories;
}
exports.getStories = getStories;
function getStoriesCacheDir(config) {
    var storiesDir = path_1.default.resolve(config.projectRoot, exports.STORY_CACHE_DIR);
    return storiesDir;
}
exports.getStoriesCacheDir = getStoriesCacheDir;
function getStoriesFile(config) {
    var storiesDir = getStoriesCacheDir(config);
    var storyFile = path_1.default.resolve(storiesDir, 'stories.js');
    return storyFile;
}
exports.getStoriesFile = getStoriesFile;
//# sourceMappingURL=shared.js.map