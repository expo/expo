"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var crypto_1 = __importDefault(require("crypto"));
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var glob_1 = __importDefault(require("glob"));
var http_1 = __importDefault(require("http"));
var path_1 = __importDefault(require("path"));
var sane_1 = __importDefault(require("sane"));
var ws_1 = __importDefault(require("ws"));
var constants_1 = require("./constants");
var getConfig_1 = require("./getConfig");
var writeRequiredFiles_1 = require("./writeRequiredFiles");
// TODO - figure out the best way to generate a pure id from filepath
//  needs to be a string with valid JS characters
function createId(data) {
    var id = crypto_1.default
        .createHash('sha256')
        .update(data)
        .digest('base64');
    id = id.replace(/[^a-zA-Z_]/gi, '');
    return id;
}
function startServer(serverConfig) {
    var config = getConfig_1.getConfig(serverConfig);
    var projectRoot = config.projectRoot, port = config.port, watchRoot = config.watchRoot;
    writeRequiredFiles_1.writeRequiredFiles(config);
    var manifestFilePath = path_1.default.resolve(projectRoot, constants_1.storiesFileDir, 'storyManifest.json');
    var storyManifest = require(manifestFilePath);
    var storiesById = {};
    var results = glob_1.default.sync('**/*.stories.{tsx,ts,js,jsx}', {
        cwd: watchRoot,
        ignore: ['**/node_modules/**', '**/ios/**', '**/android/**'],
    });
    results.forEach(function (relPath) {
        saveStoryAtPath(relPath);
    });
    var watcher = sane_1.default(watchRoot, {
        glob: ['**/*.stories.tsx', '**/*.stories.js', '**/*.stories.ts', '**/*.stories.jsx'],
        ignored: ['node_modules'],
        watchman: true,
    });
    watcher.on('change', function (relPath) {
        saveStoryAtPath(relPath);
        refreshClients();
        console.log({ storyManifest: storyManifest });
    });
    watcher.on('add', function (relPath) {
        saveStoryAtPath(relPath);
        refreshClients();
        console.log({ storyManifest: storyManifest });
    });
    watcher.on('delete', function (relPath) {
        var fullPath = path_1.default.resolve(watchRoot, relPath);
        var id = createId(fullPath);
        delete storyManifest.files[id];
        var storyManifestAsString = JSON.stringify(storyManifest, null, '\t');
        fs_1.default.writeFileSync(manifestFilePath, storyManifestAsString, {
            encoding: 'utf-8',
        });
        console.log({ storyManifest: storyManifest });
        writeStoriesFile();
        refreshClients();
    });
    watcher.on('ready', function () {
        startApp();
        refreshClients();
        logStories();
    });
    var app = express_1.default();
    app.use(body_parser_1.default.json());
    app.use(cors_1.default());
    var server = http_1.default.createServer(app);
    var wss = new ws_1.default.Server({ server: server });
    function getStories() {
        var stories = Object.keys(storyManifest.files).map(function (key) {
            return storyManifest.files[key];
        });
        return stories;
    }
    app.get('/stories', function (req, res) {
        var stories = getStories();
        res.json({ data: stories });
    });
    app.post("/stories", function (req, res) {
        var _a = req.body, type = _a.type, payload = _a.payload;
        if (type === 'selectStory') {
            var storyId = payload;
            var selectedStory = storiesById[storyId];
            if (selectedStory) {
                wss.clients.forEach(function (client) {
                    if (client.readyState === ws_1.default.OPEN) {
                        // TODO
                    }
                });
                res.json({ data: selectedStory });
                return;
            }
        }
        if (type === 'clearStory') {
            wss.clients.forEach(function (client) {
                if (client.readyState === ws_1.default.OPEN) {
                    var event_1 = {
                        type: 'clearStory',
                    };
                    client.send(JSON.stringify(event_1));
                }
            });
            res.json({ data: 'Cleared story' });
            return;
        }
        res.json({ data: 'Invalid story id provided!' });
    });
    server.on('close', cleanup);
    server.on('error', cleanup);
    function cleanup() {
        watcher.close();
    }
    function startApp() {
        server.listen(port, function () {
            console.log("Listening on http://localhost:" + port);
        });
    }
    function refreshClients() {
        wss.clients.forEach(function (client) {
            if (client.readyState === ws_1.default.OPEN) {
                var message = JSON.stringify({
                    type: 'refreshStories',
                    payload: undefined,
                });
                client.send(message);
            }
        });
    }
    function saveStoryAtPath(relPath) {
        var _a;
        var fullPath = path_1.default.resolve(watchRoot, relPath);
        var fileAsString = fs_1.default.readFileSync(fullPath, { encoding: 'utf-8' });
        var storyManifest = getStoryManifest(config);
        var id = createId(fullPath);
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
        writeStoriesFile();
    }
    function logStories() {
        var stories = getStories();
        console.log('Stories found: \n');
        console.log({ stories: stories });
    }
    function writeStoriesFile() {
        var stories = getStories();
        function captureAndWriteStoryRequires() {
            return stories
                .map(function (story) {
                storiesById[story.id] = story;
                return "\n            function " + story.id + "Setup() {\n              const stories = require(\"" + story.fullPath + "\")\n              const parentConfig = stories.default || {}\n              parentConfig.id = \"" + story.id + "\"\n\n              Object.keys(stories).forEach((key) => {\n                const Component = stories[key]\n                \n                if (typeof Component === \"function\") {\n                  const storyId = \"" + story.id + "\" + \"_\" + key\n                  \n                  Component.storyConfig = {\n                    id: storyId,\n                    name: key,\n                    ...Component.storyConfig,\n                  }\n\n                  Component.parentConfig = parentConfig\n\n                  storiesToExport[storyId] = Component \n                }\n              })\n            }\n\n            " + story.id + "Setup()\n          ";
            })
                .join('\n');
        }
        var template = "\n      const storiesToExport = {}\n      " + captureAndWriteStoryRequires() + "\n      module.exports = storiesToExport\n    ";
        if (!process.env.EXPO_DEBUG) {
            template = require('esbuild').transformSync(template, {
                minify: true,
            }).code;
        }
        var storiesDir = path_1.default.resolve(projectRoot, constants_1.storiesFileDir);
        var writeRequiresPath = path_1.default.resolve(storiesDir, 'stories.js');
        fs_1.default.writeFileSync(writeRequiresPath, template, { encoding: 'utf-8' });
    }
    ["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM"].forEach(function (eventType) {
        process.on(eventType, function () {
            cleanup();
            server.close();
            process.exit(0);
        });
    });
}
exports.startServer = startServer;
function getStoryManifest(config) {
    var manifestFilePath = path_1.default.resolve(config.projectRoot, constants_1.storiesFileDir, 'storyManifest.json');
    var storyManifest = require(manifestFilePath);
    return storyManifest;
}
//# sourceMappingURL=index.js.map