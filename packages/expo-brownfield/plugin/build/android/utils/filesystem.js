"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileFromTemplateAs = exports.createFileFromTemplate = void 0;
const filesystem_1 = require("../../common/filesystem");
const createFileFromTemplate = (template, at, variables) => {
    (0, filesystem_1.createFileFromTemplate)(template, at, 'android', variables);
};
exports.createFileFromTemplate = createFileFromTemplate;
const createFileFromTemplateAs = (template, at, as, variables) => {
    (0, filesystem_1.createFileFromTemplateAs)(template, at, as, 'android', variables);
};
exports.createFileFromTemplateAs = createFileFromTemplateAs;
