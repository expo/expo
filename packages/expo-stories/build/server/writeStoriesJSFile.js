"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeStoriesJSFile = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var shared_1 = require("./shared");
function writeStoriesJSFile(serverConfig) {
    var stories = shared_1.getStories(serverConfig);
    var template = "\n      const storiesToExport = {}\n      " + writeStoryRequires(stories) + "\n      module.exports = storiesToExport\n    ";
    if (!process.env.EXPO_DEBUG) {
        template = require('esbuild').transformSync(template, {
            minify: true,
        }).code;
    }
    var storiesDir = shared_1.getStoriesCacheDir(serverConfig);
    var writeRequiresPath = path_1.default.resolve(storiesDir, 'stories.js');
    fs_1.default.writeFileSync(writeRequiresPath, template, { encoding: 'utf-8' });
}
exports.writeStoriesJSFile = writeStoriesJSFile;
function writeStoryRequires(stories) {
    return stories
        .map(function (story) {
        var defaultTitle = story.relativePath
            .replace('.stories.tsx', '')
            .split('/')
            .pop();
        return "\n          function " + story.id + "Setup() {\n            const stories = require(\"" + story.fullPath + "\")\n            const parentConfig = stories.default || {}\n            parentConfig.id = \"" + story.id + "\"\n            parentConfig.title = parentConfig.title || '" + defaultTitle + "'\n\n            Object.keys(stories).forEach((key) => {\n              const Component = stories[key]\n              \n              if (typeof Component === \"function\") {\n                const storyId = \"" + story.id + "\" + \"_\" + key\n                \n                Component.storyConfig = {\n                  id: storyId,\n                  name: key,\n                  ...Component.storyConfig,\n                }\n\n                Component.parentConfig = parentConfig\n\n                storiesToExport[storyId] = Component \n              }\n            })\n          }\n\n          " + story.id + "Setup()\n        ";
    })
        .join('\n');
}
//# sourceMappingURL=writeStoriesJSFile.js.map