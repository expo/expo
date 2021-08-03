"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
var createFileWatcher_1 = require("./createFileWatcher");
var createHttpServer_1 = require("./createHttpServer");
var shared_1 = require("./shared");
var writeRequiredFiles_1 = require("./writeRequiredFiles");
function startServer(serverConfig) {
    var mergedConfigs = shared_1.mergeConfigs(serverConfig);
    writeRequiredFiles_1.writeRequiredFiles(mergedConfigs);
    var server = createHttpServer_1.createHttpServer(mergedConfigs);
    var watcher = createFileWatcher_1.createFileWatcher(mergedConfigs, server);
    ["SIGINT", "SIGTERM"].forEach(function (eventType) {
        process.on(eventType, function () {
            watcher.cleanup();
            server.cleanup();
            process.exit(1);
        });
    });
}
exports.startServer = startServer;
//# sourceMappingURL=index.js.map