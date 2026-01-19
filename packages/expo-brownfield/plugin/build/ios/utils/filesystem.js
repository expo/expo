"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFromTemplate = exports.createFileFromTemplateAs = exports.createFileFromTemplate = exports.mkdir = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const filesystem_1 = require("../../common/filesystem");
const mkdir = (path, recursive = false) => {
    node_fs_1.default.mkdirSync(path, {
        recursive,
    });
};
exports.mkdir = mkdir;
const createFileFromTemplate = (template, at, variables) => {
    (0, filesystem_1.createFileFromTemplate)(template, at, 'ios', variables);
};
exports.createFileFromTemplate = createFileFromTemplate;
const createFileFromTemplateAs = (template, at, as, variables) => {
    (0, filesystem_1.createFileFromTemplateAs)(template, at, as, 'ios', variables);
};
exports.createFileFromTemplateAs = createFileFromTemplateAs;
const readFromTemplate = (template, variables) => {
    return (0, filesystem_1.readFromTemplate)(template, 'ios', variables);
};
exports.readFromTemplate = readFromTemplate;
