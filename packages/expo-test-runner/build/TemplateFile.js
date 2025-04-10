"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateFilesFactory = exports.UserFile = exports.TemplateFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const Paths_1 = require("./Paths");
const Platform_1 = require("./Platform");
class TemplateFile {
    template;
    platform;
    shouldBeEvaluated;
    constructor(template, platform = Platform_1.Platform.Both, shouldBeEvaluated = false) {
        this.template = template;
        this.platform = platform;
        this.shouldBeEvaluated = shouldBeEvaluated;
    }
    async copy(projectPath, outputPath) {
        const src = (0, path_1.join)(Paths_1.SelfPath, 'templates', this.template, outputPath);
        const dest = (0, path_1.join)(projectPath, outputPath);
        const stat = await fs_1.default.promises.stat(src);
        if (!stat.isFile()) {
            // NOTE(@kitten): Explicit error was added when switching from fs-extra.copy, which defaults to recursive copying
            // However, this should only be used on single files, so an explicit error was added
            throw new TypeError(`Expected outputPath (${outputPath}) to be path to a single file`);
        }
        await fs_1.default.promises.mkdir((0, path_1.dirname)(dest), { recursive: true });
        return fs_1.default.promises.copyFile(src, dest);
    }
    async evaluate(projectPath, filePath, evaluator) {
        if (this.shouldBeEvaluated) {
            return evaluator.compileFileAsync((0, path_1.join)(projectPath, filePath));
        }
        return Promise.resolve();
    }
}
exports.TemplateFile = TemplateFile;
class UserFile {
    userFilePath;
    platform;
    shouldBeEvaluated;
    constructor(userFilePath, platform = Platform_1.Platform.Both, shouldBeEvaluated = false) {
        this.userFilePath = userFilePath;
        this.platform = platform;
        this.shouldBeEvaluated = shouldBeEvaluated;
    }
    copy(projectPath, outputPath) {
        return fs_1.default.promises.cp(this.userFilePath, (0, path_1.join)(projectPath, outputPath), {
            recursive: true,
        });
    }
    evaluate(projectPath, filePath, evaluator) {
        if (this.shouldBeEvaluated) {
            return evaluator.compileFileAsync((0, path_1.join)(projectPath, filePath));
        }
        return Promise.resolve();
    }
}
exports.UserFile = UserFile;
class TemplateFilesFactory {
    template;
    constructor(template) {
        this.template = template;
    }
    file(shouldBeEvaluated = false) {
        return new TemplateFile(this.template, Platform_1.Platform.Both, shouldBeEvaluated);
    }
    androidFile(shouldBeEvaluated = false) {
        return new TemplateFile(this.template, Platform_1.Platform.Android, shouldBeEvaluated);
    }
    iosFile(shouldBeEvaluated = false) {
        return new TemplateFile(this.template, Platform_1.Platform.iOS, shouldBeEvaluated);
    }
}
exports.TemplateFilesFactory = TemplateFilesFactory;
//# sourceMappingURL=TemplateFile.js.map