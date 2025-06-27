"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-mail-composer/package.json');
/**
 * Keep the mail client URLs in sync with those in the file `ios/MailClients.swift`.
 */
const mailClientURLs = [
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
    'mymail-mailto',
];
const withMailComposer = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.LSApplicationQueriesSchemes = [
            ...(config.modResults.LSApplicationQueriesSchemes ?? []),
            ...mailClientURLs,
        ];
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withMailComposer, pkg.name, pkg.version);
