"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXcodeProjectPlugin = exports.withPodfilePropertiesPlugin = exports.withPodfilePlugin = exports.withBuildPropertiesPlugin = void 0;
var withBuildPropertiesPlugin_1 = require("./withBuildPropertiesPlugin");
Object.defineProperty(exports, "withBuildPropertiesPlugin", { enumerable: true, get: function () { return __importDefault(withBuildPropertiesPlugin_1).default; } });
var withPodfilePlugin_1 = require("./withPodfilePlugin");
Object.defineProperty(exports, "withPodfilePlugin", { enumerable: true, get: function () { return __importDefault(withPodfilePlugin_1).default; } });
var withPodfilePropertiesPlugin_1 = require("./withPodfilePropertiesPlugin");
Object.defineProperty(exports, "withPodfilePropertiesPlugin", { enumerable: true, get: function () { return __importDefault(withPodfilePropertiesPlugin_1).default; } });
var withXcodeProjectPlugin_1 = require("./withXcodeProjectPlugin");
Object.defineProperty(exports, "withXcodeProjectPlugin", { enumerable: true, get: function () { return __importDefault(withXcodeProjectPlugin_1).default; } });
