"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTasksAndroid = exports.runBuildAndroid = void 0;
var build_1 = require("./build");
Object.defineProperty(exports, "runBuildAndroid", { enumerable: true, get: function () { return __importDefault(build_1).default; } });
var tasks_1 = require("./tasks");
Object.defineProperty(exports, "runTasksAndroid", { enumerable: true, get: function () { return __importDefault(tasks_1).default; } });
