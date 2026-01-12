"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFromTemplate = exports.createFileFromTemplateAs = exports.createFileFromTemplate = exports.mkdir = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const mkdir = (path, recursive = false) => {
    (0, node_fs_1.mkdirSync)(path, {
        recursive,
    });
};
exports.mkdir = mkdir;
const interpolateVariables = (str, variables) => {
    const variableRegex = /\${{[A-z0-9]+}}/;
    let match = variableRegex.exec(str);
    while (match) {
        const variable = match[0].slice(3, -2);
        str = str.replace(match[0], String(variables[variable]));
        match = variableRegex.exec(str);
    }
    return str;
};
const maybeReadOverwrittenTemplate = (template, platform) => {
    try {
        (0, node_fs_1.accessSync)(node_path_1.default.join(process.cwd(), '.brownfield-templates'));
        if ((0, node_fs_1.existsSync)(node_path_1.default.join(process.cwd(), '.brownfield-templates', template))) {
            return (0, node_fs_1.readFileSync)(node_path_1.default.join(process.cwd(), '.brownfield-templates', template)).toString();
        }
        if ((0, node_fs_1.existsSync)(node_path_1.default.join(process.cwd(), '.brownfield-templates', platform ?? '.', template))) {
            return (0, node_fs_1.readFileSync)(node_path_1.default.join(process.cwd(), '.brownfield-templates', platform ?? '.', template)).toString();
        }
        // eslint-disable-next-line no-empty
    }
    catch { }
    return '';
};
const readTemplate = (template, platform) => {
    // First check if the template exists in the .brownfield-templates directory
    const overwrittenTemplate = maybeReadOverwrittenTemplate(template, platform);
    if (overwrittenTemplate) {
        return overwrittenTemplate;
    }
    // If not use the default template
    const templatesPath = node_path_1.default.join(__filename, '../../..', 'templates', platform ?? '.');
    const templatePath = node_path_1.default.join(templatesPath, template);
    if (!(0, node_fs_1.existsSync)(templatePath)) {
        throw new Error(`Template ${template} doesn't exist at ${templatePath}`);
    }
    return (0, node_fs_1.readFileSync)(templatePath).toString();
};
const createFileFromTemplateInternal = (template, at, dest, platform, variables) => {
    let templateContents = readTemplate(template, platform);
    if (variables) {
        templateContents = interpolateVariables(templateContents, variables);
    }
    const destPath = node_path_1.default.join(at, dest);
    (0, node_fs_1.writeFileSync)(destPath, templateContents);
};
const createFileFromTemplate = (template, at, platform, variables) => {
    createFileFromTemplateInternal(template, at, template, platform, variables);
};
exports.createFileFromTemplate = createFileFromTemplate;
const createFileFromTemplateAs = (template, at, as, platform, variables) => {
    createFileFromTemplateInternal(template, at, as, platform, variables);
};
exports.createFileFromTemplateAs = createFileFromTemplateAs;
const readFromTemplate = (template, platform, variables) => {
    let templateContents = readTemplate(template, platform);
    if (variables) {
        templateContents = interpolateVariables(templateContents, variables);
    }
    return templateContents;
};
exports.readFromTemplate = readFromTemplate;
