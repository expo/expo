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
exports.addStoriesAsync = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var saveManifestAsync_1 = require("./saveManifestAsync");
var shared_1 = require("./shared");
var writeStoriesAsync_1 = require("./writeStoriesAsync");
function addStoriesAsync(relPaths, config) {
    return __awaiter(this, void 0, void 0, function () {
        var watchRoot, projectRoot, storyManifest;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    watchRoot = config.watchRoot, projectRoot = config.projectRoot;
                    storyManifest = (0, shared_1.getStoryManifest)(projectRoot);
                    // 2. update story manifest with new files
                    return [4 /*yield*/, Promise.all(relPaths.map(function (relativePath) { return __awaiter(_this, void 0, void 0, function () {
                            var fullPath, id, defaultTitle, story;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        fullPath = path_1.default.resolve(watchRoot, relativePath);
                                        id = (0, shared_1.hashPath)(fullPath);
                                        defaultTitle = (_a = relativePath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.stories.tsx', '');
                                        return [4 /*yield*/, parseStoryConfigAsync({
                                                id: id,
                                                fullPath: fullPath,
                                                relativePath: relativePath,
                                                title: defaultTitle || '',
                                                stories: [],
                                            })];
                                    case 1:
                                        story = _b.sent();
                                        storyManifest.files[story.id] = story;
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 1:
                    // 2. update story manifest with new files
                    _a.sent();
                    // 3. save updated manifest to disk
                    return [4 /*yield*/, (0, saveManifestAsync_1.saveManifestAsync)(storyManifest, config)];
                case 2:
                    // 3. save updated manifest to disk
                    _a.sent();
                    // 4. write js file based on updated manifest
                    return [4 /*yield*/, (0, writeStoriesAsync_1.writeStoriesAsync)(config)];
                case 3:
                    // 4. write js file based on updated manifest
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.addStoriesAsync = addStoriesAsync;
function parseStoryConfigAsync(storyFile) {
    return __awaiter(this, void 0, void 0, function () {
        var fullPath, id, file, acorn, parsed, storyData, defaultExport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fullPath = storyFile.fullPath, id = storyFile.id;
                    return [4 /*yield*/, fs_extra_1.default.readFile(fullPath, { encoding: 'utf-8' })];
                case 1:
                    file = _a.sent();
                    acorn = require('acorn-loose');
                    parsed = acorn.parse(file, {
                        ecmaVersion: 2020,
                        sourceType: 'module',
                    });
                    storyData = __assign({}, storyFile);
                    parsed.body.forEach(function (node) {
                        if (node.type === 'ExportNamedDeclaration') {
                            if (node.declaration !== null) {
                                var type = node.declaration.type;
                                if (type === 'VariableDeclaration') {
                                    node.declaration.declarations.forEach(function (d) {
                                        var name = d.id.name;
                                        storyData.stories.push({
                                            name: name,
                                            id: "".concat(id, "_").concat(name),
                                        });
                                    });
                                }
                                if (type === 'FunctionDeclaration') {
                                    var name_1 = node.declaration.id.name;
                                    console.log({ node: node });
                                    storyData.stories.push({
                                        name: name_1,
                                        id: "".concat(id, "_").concat(name_1),
                                    });
                                }
                            }
                            if (node.specifiers.length > 0) {
                                node.specifiers.forEach(function (specifier) {
                                    var name = specifier.exported.name;
                                    if (!storyData.stories.includes(name)) {
                                        storyData.stories.push({
                                            name: name,
                                            id: "".concat(id, "_").concat(name),
                                        });
                                    }
                                });
                            }
                        }
                    });
                    defaultExport = parsed.body.find(function (node) { return node.type === 'ExportDefaultDeclaration'; });
                    if (defaultExport) {
                        defaultExport.declaration.properties.forEach(function (property) {
                            var key = property.key.name;
                            var value = property.value.value;
                            storyData[key] = value;
                        });
                    }
                    return [2 /*return*/, storyData];
            }
        });
    });
}
//# sourceMappingURL=addStoriesAsync.js.map