"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVersion = exports.runHelp = void 0;
var help_1 = require("./help");
Object.defineProperty(exports, "runHelp", { enumerable: true, get: function () { return __importDefault(help_1).default; } });
var version_1 = require("./version");
Object.defineProperty(exports, "runVersion", { enumerable: true, get: function () { return __importDefault(version_1).default; } });
