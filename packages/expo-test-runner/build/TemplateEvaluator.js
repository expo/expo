"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dot_1 = require("dot");
const fs_1 = __importDefault(require("fs"));
class TemplateEvaluator {
    definitions;
    constructor(definitions) {
        this.definitions = definitions;
    }
    async compileFileAsync(path) {
        const fileContent = await fs_1.default.promises.readFile(path, 'utf-8');
        const templateFn = (0, dot_1.template)(fileContent, {
            strip: false,
        });
        await fs_1.default.promises.writeFile(path, templateFn(this.definitions));
    }
}
exports.default = TemplateEvaluator;
//# sourceMappingURL=TemplateEvaluator.js.map