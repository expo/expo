"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-mail-composer/package.json');
/**
 * Keep the mail client URIs in sync with those in the file `src/openClientAsync.ios.ts`.
 */
const mailClients = [
    'airmail',
    'message',
    'bluemail',
    'canary',
    'edisonmail',
    'szn-email',
    'fastmail',
    'x-gmxmail-netid-v1',
    'googlegmail',
    'mailrumail',
    'ms-outlook',
    'protonmail',
    'ctxmail',
    'readdle-spark',
    'superhuman',
    'telekommail',
    'tutanota',
    'x-webdemail-netid-v1',
    'ymail',
    'yandexmail',
    'appcenter-f45b4c0b-75c9-2d01-7ab6-41f6a6015be2',
    'mymail-mailto',
];
const withMailComposer = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.LSApplicationQueriesSchemes = [
            ...(config.modResults.LSApplicationQueriesSchemes ?? []),
            ...mailClients,
        ];
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withMailComposer, pkg.name, pkg.version);
