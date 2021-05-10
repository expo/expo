"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNoopSwiftFile = void 0;
const config_plugins_1 = require("@expo/config-plugins");
exports.withNoopSwiftFile = config => {
    return config_plugins_1.IOSConfig.XcodeProjectFile.withBuildSourceFile(config, {
        filePath: 'noop-file.swift',
        contents: [
            '//',
            '// @generated',
            '// A blank Swift file must be created for native modules with Swift files to work correctly.',
            '//',
            '',
        ].join('\n'),
    });
};
