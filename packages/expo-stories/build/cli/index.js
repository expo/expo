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
var commander_1 = require("commander");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var build_1 = require("./commands/build");
var init_1 = require("./commands/init");
var watch_1 = require("./commands/watch");
var shared_1 = require("./shared");
commander_1.program.version('0.0.1');
commander_1.program.name('expo-stories');
var initCommand = new commander_1.Command();
initCommand
    .name('start')
    .option('-p --projectRoot <path>', 'the directory where the RN stories app will run', process.cwd())
    .option('-w --watchRoot <path>', 'the directory to search for .stories files', process.cwd())
    .option('--no-watch', 'disable watching source file changes', false)
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var pkgPath, pkgJson, config;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pkgPath = path_1.default.resolve(process.cwd(), 'package.json');
                if (fs_1.default.existsSync(pkgPath)) {
                    pkgJson = require(pkgPath);
                    if (pkgJson.expoStories != null) {
                        options = __assign(__assign({}, options), pkgJson.expoStories);
                    }
                }
                config = __assign(__assign({}, shared_1.defaultConfig), options);
                config.watchRoot = path_1.default.resolve(process.cwd(), config.watchRoot);
                return [4 /*yield*/, (0, init_1.initAsync)(config)];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, build_1.buildAsync)(config)];
            case 2:
                _a.sent();
                if (!options.watch) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, watch_1.watchAsync)(config)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
commander_1.program.addCommand(initCommand);
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map