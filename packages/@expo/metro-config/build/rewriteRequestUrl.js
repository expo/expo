"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRewriteRequestUrl = void 0;
// Copyright 2023-present 650 Industries (Expo). All rights reserved.
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const getModulesPaths_1 = require("./getModulesPaths");
const debug = require('debug')('expo:metro:config:rewriteRequestUrl');
function getRewriteRequestUrl(projectRoot) {
    function rewriteExpoRequestUrl(url) {
        // Like: `/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
        // Sometimes a fully qualified URL is passed in, e.g. `http://localhost:19001/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
        if (url.includes('/.expo/.virtual-metro-entry.bundle?')) {
            const ensured = url.startsWith('/') ? new URL(url, 'https://acme.dev') : new URL(url);
            // TODO: Maybe this function could be memoized in some capacity?
            const { search, searchParams } = ensured;
            const platform = searchParams.get('platform') ?? 'web';
            debug('Rewriting magic request url to entry point', { url, platform });
            const entry = (0, paths_1.resolveEntryPoint)(projectRoot, {
                platform,
                // @ts-ignore
                projectConfig: {
                    pkg: (0, config_1.getPackageJson)(projectRoot),
                },
            });
            if (!entry) {
                throw new Error((0, chalk_1.default) `The project entry file could not be resolved (platform: ${platform}, root: ${projectRoot}). Define it in the {bold package.json} "main" field.`);
            }
            const serverRoot = (0, getModulesPaths_1.getServerRoot)(projectRoot);
            const relativeEntry = path_1.default.relative(serverRoot, entry);
            debug('Resolved entry point', { entry, relativeEntry, serverRoot });
            // Like: `/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
            return '/' + relativeEntry + '.bundle' + search;
        }
        return url;
    }
    return rewriteExpoRequestUrl;
}
exports.getRewriteRequestUrl = getRewriteRequestUrl;
