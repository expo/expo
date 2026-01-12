"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpMessageSection = exports.helpMessage = void 0;
const chalk_1 = __importDefault(require("chalk"));
const output_1 = require("../constants/output");
const helpMessage = ({ commands, options, promptCommand = '<command>', promptOptions = '<options>', }) => {
    const optionsSection = (0, exports.helpMessageSection)({
        items: options,
        left: ({ option, short }) => `${option}${short ? `, ${short}` : ''}`,
        right: ({ description }) => description,
        title: 'Options:',
    });
    const commandsSection = (0, exports.helpMessageSection)({
        items: commands,
        left: ({ command, hasOptions }) => `${command}${hasOptions ? ` [${promptOptions}]` : ''}`,
        right: ({ description }) => description,
        title: 'Commands:',
    });
    const usageSection = `${chalk_1.default.bold('Usage:')} expo-brownfield ${promptCommand}  [${promptOptions}]`;
    return `\n${usageSection}${optionsSection}${commandsSection}\n`;
};
exports.helpMessage = helpMessage;
const helpMessageSection = ({ items, left, right, title, }) => {
    if (!items) {
        return '';
    }
    const content = items.reduce((acc, item) => {
        const ls = left(item);
        const rs = right(item);
        const spacing = ' '.repeat(output_1.Output.HelpSpacing - ls.length);
        return `${acc}\n  ${ls}${spacing}${rs}`;
    }, '');
    return `\n\n${chalk_1.default.bold(title)}${content}`;
};
exports.helpMessageSection = helpMessageSection;
