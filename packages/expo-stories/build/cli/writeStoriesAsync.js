"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeStoriesAsync = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var shared_1 = require("./shared");
function writeStoriesAsync(config) {
    return __awaiter(this, void 0, void 0, function () {
        var projectRoot, storyManifest, stories, template, storiesDir, writeRequiresPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectRoot = config.projectRoot;
                    storyManifest = (0, shared_1.getStoryManifest)(projectRoot);
                    stories = Object.keys(storyManifest.files).map(function (id) { return storyManifest.files[id]; });
                    template = "\n      const storiesToExport = {}\n      ".concat(stories.map(function (story) { return generateTemplateForStory(story); }).join(''), "\n      module.exports = storiesToExport\n    ");
                    if (!process.env.EXPO_DEBUG) {
                        template = require('esbuild').transformSync(template, {
                            minify: true,
                        }).code;
                    }
                    storiesDir = (0, shared_1.getStoriesDir)({ projectRoot: projectRoot });
                    writeRequiresPath = path_1.default.resolve(storiesDir, 'stories.js');
                    return [4 /*yield*/, fs_extra_1.default.writeFile(writeRequiresPath, template, { encoding: 'utf-8' })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.writeStoriesAsync = writeStoriesAsync;
// the formatting of this template is important because it preserves fast refresh w/ metro
function generateTemplateForStory(story) {
    var defaultTitle = story.relativePath.replace('.stories.tsx', '').split('/').pop();
    return "\n    function ".concat(story.id, "Setup() {\n      const stories = require(\"").concat(story.fullPath, "\")\n      const file = stories.default || {}\n      file.id = \"").concat(story.id, "\"\n      file.title = file.title || '").concat(defaultTitle, "'\n\n      Object.keys(stories).forEach((key) => {\n        const Component = stories[key]\n        \n        if (typeof Component === \"function\") {\n          const storyId = \"").concat(story.id, "\" + \"_\" + key\n          \n          Component.storyConfig = {\n            id: storyId,\n            name: key,\n            ...Component.storyConfig,\n          }\n\n          Component.file = file\n\n          storiesToExport[storyId] = Component \n        }\n      })\n    }\n\n    ").concat(story.id, "Setup()\n  ");
}
//# sourceMappingURL=writeStoriesAsync.js.map