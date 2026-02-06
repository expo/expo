"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksAndroid = exports.buildIos = exports.buildAndroid = void 0;
var build_android_1 = require("./build-android");
Object.defineProperty(exports, "buildAndroid", { enumerable: true, get: function () { return __importDefault(build_android_1).default; } });
var build_ios_1 = require("./build-ios");
Object.defineProperty(exports, "buildIos", { enumerable: true, get: function () { return __importDefault(build_ios_1).default; } });
var tasks_android_1 = require("./tasks-android");
Object.defineProperty(exports, "tasksAndroid", { enumerable: true, get: function () { return __importDefault(tasks_android_1).default; } });
