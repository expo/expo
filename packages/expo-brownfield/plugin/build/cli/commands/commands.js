"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const android_1 = require("./android");
const general_1 = require("./general");
const ios_1 = require("./ios");
exports.Commands = {
    'build-android': {
        run: android_1.runBuildAndroid,
    },
    'build-ios': {
        run: ios_1.runBuildIos,
    },
    help: {
        run: general_1.runHelp,
    },
    'tasks-android': {
        run: android_1.runTasksAndroid,
    },
    version: {
        run: general_1.runVersion,
    },
};
