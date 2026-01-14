"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIos = exports.resolveAndroid = exports.resolveCommand = void 0;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const commands_1 = require("./commands");
const resolveCommand = () => {
    const args = (0, utils_1.parseArgs)({ spec: constants_1.Args.General, stopAtPositional: true });
    if (args['--help']) {
        return commands_1.Commands.help;
    }
    if (args['--version']) {
        return commands_1.Commands.version;
    }
    const command = args['_']?.length > 0 ? args['_'][0] : '';
    if (command === 'build-android' || command === 'tasks-android') {
        return (0, exports.resolveAndroid)(command);
    }
    if (command === 'build-ios') {
        return (0, exports.resolveIos)();
    }
    return constants_1.Errors.unknownCommand();
};
exports.resolveCommand = resolveCommand;
const resolveAndroid = (command) => {
    return commands_1.Commands[command];
};
exports.resolveAndroid = resolveAndroid;
const resolveIos = () => {
    return commands_1.Commands['build-ios'];
};
exports.resolveIos = resolveIos;
