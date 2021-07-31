"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileWatcher = void 0;
var fs_1 = __importDefault(require("fs"));
var glob_1 = __importDefault(require("glob"));
var path_1 = __importDefault(require("path"));
var sane_1 = __importDefault(require("sane"));
var generateId_1 = require("./generateId");
var saveStoryDataAtPath_1 = require("./saveStoryDataAtPath");
var shared_1 = require("./shared");
var writeStoriesJSFile_1 = require("./writeStoriesJSFile");
function createFileWatcher(config, server) {
    var watchRoot = config.watchRoot;
    var results = glob_1.default.sync('**/*.stories.{tsx,ts,js,jsx}', {
        cwd: watchRoot,
        ignore: ['**/node_modules/**', '**/ios/**', '**/android/**'],
    });
    results.forEach(function (relPath) {
        saveStoryDataAtPath_1.saveStoryDataAtPath(config, relPath);
    });
    var manifestFilePath = shared_1.getManifestFilePath(config);
    var storyManifest = shared_1.getStoryManifest(config);
    var watcher = sane_1.default(watchRoot, {
        glob: ['**/*.stories.tsx', '**/*.stories.js', '**/*.stories.ts', '**/*.stories.jsx'],
        ignored: ['node_modules'],
        watchman: true,
    });
    // require filepath shoul pick up on fast refresh changes
    // any other changes would need to go through websockets
    // watcher.on('change', relPath => {
    //   saveStoryDataAtPath(config, relPath);
    //   server.refreshClients();
    // });
    watcher.on('add', function (relPath) {
        saveStoryDataAtPath_1.saveStoryDataAtPath(config, relPath);
        server.refreshClients();
    });
    watcher.on('delete', function (relPath) {
        var fullPath = path_1.default.resolve(watchRoot, relPath);
        var id = generateId_1.generateId(fullPath);
        delete storyManifest.files[id];
        var storyManifestAsString = JSON.stringify(storyManifest, null, '\t');
        fs_1.default.writeFileSync(manifestFilePath, storyManifestAsString, {
            encoding: 'utf-8',
        });
        writeStoriesJSFile_1.writeStoriesJSFile(config);
        server.refreshClients();
    });
    watcher.on('ready', function () {
        server.start();
        server.refreshClients();
        logStories();
    });
    function logStories() {
        var stories = shared_1.getStories(config);
        console.log('Stories found: \n');
        console.log({ stories: stories });
    }
    function cleanup() {
        watcher.close();
    }
    return {
        cleanup: cleanup,
    };
}
exports.createFileWatcher = createFileWatcher;
//# sourceMappingURL=createFileWatcher.js.map