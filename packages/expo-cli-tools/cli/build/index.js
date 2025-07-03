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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var expo_cli_extensions_1 = require("expo-cli-extensions");
var fs_1 = require("fs");
var screenshot_1 = require("./screenshot");
(0, expo_cli_extensions_1.cliExtension)(function (cmd, args, apps) { return __awaiter(void 0, void 0, void 0, function () {
    var screenshots, pwd, command;
    return __generator(this, function (_a) {
        // Validate command
        if (cmd === 'outdated') {
            try {
                console.log("Running: npx expo install --check");
                console.log((0, child_process_1.execSync)('npm_config_yes=true npx expo install --check', { encoding: 'utf8' }));
            }
            catch (error) {
                throw new Error('An error occured running the command\n' + error.toString());
            }
        }
        else if (cmd === 'upgrade') {
            try {
                console.log("Running: npx expo install expo@latest");
                console.log((0, child_process_1.execSync)('npm_config_yes=true npx expo install expo@latest', { encoding: 'utf8' }));
            }
            catch (error) {
                throw new Error('An error occured running the command\n' + error.toString());
            }
        }
        else if (cmd === 'doctor') {
            try {
                console.log("Running: npx expo-doctor", process.cwd());
                console.log((0, child_process_1.execSync)('npx expo-doctor', {
                    encoding: 'utf8',
                    env: __assign(__assign({}, process.env), { npm_config_yes: 'true' }),
                }));
            }
            catch (error) {
                throw new Error('An error occured running the command\n' + error.toString());
            }
        }
        else if (cmd === 'take_screenshot') {
            try {
                if (apps.length === 0) {
                    throw new Error('No apps connected to the dev server. Please connect an app to use this command.');
                }
                screenshots = apps.map(function (app) { return ({ app: app, filename: (0, screenshot_1.takeScreenshot)(app) }); });
                if (args.source === 'mcp') {
                    // If we're running in MCP mode, we can send the screenshot back to the MCP server
                    return [2 /*return*/, screenshots
                            .map(function (_a) {
                            var app = _a.app, filename = _a.filename;
                            var fileBuffer = fs_1.default.readFileSync(filename);
                            var base64 = fileBuffer.toString('base64');
                            return [
                                { type: 'text', text: app.deviceName },
                                { type: 'image', data: base64, mimeType: 'image/png' },
                            ];
                        })
                            .flat()];
                }
                else {
                    // We'll just print the path to the screenshot
                    return [2 /*return*/, screenshots
                            .map(function (_a) {
                            var app = _a.app, filename = _a.filename;
                            return [{ type: 'text', text: app.deviceName, url: filename }];
                        })
                            .flat()];
                }
            }
            catch (error) {
                throw new Error('An error occured connecting to the app:\n' + error.toString());
            }
        }
        else if (cmd === 'clear_watchman') {
            pwd = process.cwd();
            command = "watchman watch-del '".concat(pwd, "' ; watchman watch-project '").concat(pwd, "'");
            console.log('Running:', command);
            (0, child_process_1.execSync)(command, { stdio: 'inherit' });
        }
        else if (cmd === 'list_apps') {
            console.log('Connected apps:');
            console.log(JSON.stringify(apps, null, 2));
        }
        else {
            return [2 /*return*/, Promise.reject(new Error("The command ".concat(cmd, " is an unknown command for this tool.")))];
        }
        return [2 /*return*/];
    });
}); });
//# sourceMappingURL=index.js.map