"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpServer = void 0;
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var ws_1 = __importDefault(require("ws"));
var shared_1 = require("./shared");
function createHttpServer(config) {
    var app = express_1.default();
    app.use(body_parser_1.default.json());
    app.use(cors_1.default());
    var server = http_1.default.createServer(app);
    var wss = new ws_1.default.Server({ server: server });
    app.get('/stories', function (req, res) {
        var stories = shared_1.getStories(config);
        res.json({ data: stories });
    });
    app.post("/stories", function (req, res) {
        var _a = req.body, type = _a.type, payload = _a.payload;
        if (type === 'selectStory') {
            // TODO
            // const storyId: string = payload;
            // const selectedStory = storiesById[storyId];
            // if (selectedStory) {
            //   wss.clients.forEach(client => {
            //     if (client.readyState === ws.OPEN) {
            //     }
            //   });
            //   res.json({ data: selectedStory });
            // return;
            // }
        }
        if (type === 'clearStory') {
            wss.clients.forEach(function (client) {
                if (client.readyState === ws_1.default.OPEN) {
                    // TODO
                    // const event = {
                    //   type: 'clearStory',
                    // };
                    // client.send(JSON.stringify(event));
                }
            });
            res.json({ data: 'Cleared story' });
            return;
        }
        res.json({ data: 'Invalid story id provided!' });
    });
    function start() {
        var port = config.port;
        server.listen(port, function () {
            console.log("Listening on http://localhost:" + port);
        });
    }
    function refreshClients() {
        // TODO
        wss.clients.forEach(function (client) {
            if (client.readyState === ws_1.default.OPEN) {
                // const message = JSON.stringify({
                //   type: 'refreshStories',
                //   payload: undefined,
                // });
                // client.send(message);
            }
        });
    }
    function cleanup() {
        server.close();
        wss.close();
    }
    server.on('close', cleanup);
    server.on('error', cleanup);
    return {
        start: start,
        refreshClients: refreshClients,
        cleanup: cleanup,
    };
}
exports.createHttpServer = createHttpServer;
//# sourceMappingURL=createHttpServer.js.map