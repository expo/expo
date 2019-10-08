"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@expo/config");
const fs_1 = __importDefault(require("fs"));
const getenv_1 = require("getenv");
const path_1 = __importDefault(require("path"));
function getPuppeteerOptions() {
    if (getenv_1.boolish('CI', false)) {
        return {
            args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox'],
            ignoreHTTPSErrors: true,
            headless: true,
        };
    }
    return {
        args: ['--ignore-certificate-errors'],
        ignoreHTTPSErrors: true,
        headless: true,
    };
}
function isUndefined(value) {
    return typeof value === 'undefined';
}
function ofCommands(commands) {
    return commands.filter(Boolean).join(' && ');
}
function withExpoPuppeteer(config = {}) {
    const { mode = process.env.EXPO_WEB_E2E_ENV, preventRebuild, server = {}, launch = {}, projectRoot } = config, partConfig = __rest(config, ["mode", "preventRebuild", "server", "launch", "projectRoot"]);
    const projectPath = path_1.default.resolve(projectRoot || process.cwd());
    // @ts-ignore: ProjectConfig doesn't declare "web" -- either fix this or the declaration
    const { web = {} } = config_1.readConfigJson(projectPath);
    const hasServerSideRendering = web.use === 'nextjs';
    const defaultPort = hasServerSideRendering ? 8000 : 5000;
    const { port: serverPort = defaultPort } = server;
    let defaultURL;
    let command;
    // Tell Expo CLI to use the same port on which the test runner expects there to be a server
    process.env.WEB_PORT = serverPort;
    if (mode === 'production') {
        defaultURL = `http://localhost:${serverPort}`;
        const outputBuildPath = (web.build || {}).output || 'web-build';
        const buildFolder = path_1.default.resolve(projectPath, outputBuildPath);
        const serveCommand = `serve ${buildFolder}`;
        const commands = [serveCommand];
        const hasBuild = fs_1.default.existsSync(buildFolder);
        if (!preventRebuild || !hasBuild) {
            const buildCommand = `node ${require.resolve('./build-expo.js')} ${projectPath}`;
            commands.unshift(buildCommand);
        }
        command = ofCommands(commands);
    }
    else {
        command = `expo start ${projectPath} --web-only --non-interactive --https`;
        defaultURL = `https://localhost:${serverPort}`;
    }
    const hasModules = fs_1.default.existsSync(path_1.default.resolve(projectPath, 'node_modules'));
    let launchTimeout = isNaN(server.launchTimeout) ? 30000 : server.launchTimeout;
    if (!hasModules) {
        launchTimeout += 30000;
        command = ofCommands([`cd ${projectPath} && yarn && cd ${process.cwd()}`, command]);
    }
    const url = isUndefined(config.url) ? defaultURL : config.url;
    return Object.assign(Object.assign({ hasServerSideRendering }, partConfig), { url, launch: Object.assign(Object.assign({}, getPuppeteerOptions()), launch), server: Object.assign(Object.assign({ launchTimeout, debug: true }, server), { command, port: serverPort }) });
}
exports.withExpoPuppeteer = withExpoPuppeteer;
//# sourceMappingURL=index.js.map