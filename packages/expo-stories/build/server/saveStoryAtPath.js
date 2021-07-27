"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStoryDataAtPath = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var generateId_1 = require("./generateId");
var shared_1 = require("./shared");
var writeStoriesFile_1 = require("./writeStoriesFile");
function saveStoryDataAtPath(config, relPath) {
    var _a;
    var watchRoot = config.watchRoot;
    var fullPath = path_1.default.resolve(watchRoot, relPath);
    var fileAsString = fs_1.default.readFileSync(fullPath, { encoding: 'utf-8' });
    var manifestFilePath = shared_1.getManifestFilePath(config);
    var storyManifest = shared_1.getStoryManifest(config);
    var id = generateId_1.generateId(fullPath);
    var acorn = require('acorn-loose');
    var parsed = acorn.parse(fileAsString, {
        ecmaVersion: 2020,
        sourceType: 'module',
    });
    var title = (_a = relPath
        .split('/')
        .pop()) === null || _a === void 0 ? void 0 : _a.replace('.stories.tsx', '');
    var storyData = {
        title: title || '',
        stories: [],
    };
    parsed.body.forEach(function (node) {
        if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration !== null) {
                var type = node.declaration.type;
                if (type === 'VariableDeclaration') {
                    node.declaration.declarations.forEach(function (d) {
                        var name = d.id.name;
                        storyData.stories.push({
                            name: name,
                            key: name,
                            id: id + "_" + name,
                        });
                    });
                }
                if (type === 'FunctionDeclaration') {
                    var name_1 = node.declaration.id.name;
                    storyData.stories.push({
                        name: name_1,
                        key: name_1,
                        id: id + "_" + name_1,
                    });
                }
            }
            if (node.specifiers.length > 0) {
                node.specifiers.forEach(function (specifier) {
                    var name = specifier.exported.name;
                    if (!storyData.stories.includes(name)) {
                        storyData.stories.push({
                            name: name,
                            key: name,
                            id: id + "_" + name,
                        });
                    }
                });
            }
        }
    });
    var defaultExport = parsed.body.find(function (node) { return node.type === 'ExportDefaultDeclaration'; });
    if (defaultExport) {
        defaultExport.declaration.properties.forEach(function (property) {
            var key = property.key.name;
            var value = property.value.value;
            storyData[key] = value;
        });
    }
    storyManifest.files[id] = {
        id: id,
        fullPath: fullPath,
        relativePath: relPath,
    };
    var cachedFile = storyManifest.files[id];
    cachedFile.title = storyData.title;
    cachedFile.stories = storyData.stories;
    var storyManifestAsString = JSON.stringify(storyManifest, null, '\t');
    fs_1.default.writeFileSync(manifestFilePath, storyManifestAsString, {
        encoding: 'utf-8',
    });
    writeStoriesFile_1.writeStoriesFile(config);
}
exports.saveStoryDataAtPath = saveStoryDataAtPath;
//# sourceMappingURL=saveStoryAtPath.js.map