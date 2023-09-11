"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateFilesFactory = exports.UserFile = exports.TemplateFile = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = require("path");
const Paths_1 = require("./Paths");
const Platform_1 = require("./Platform");
class TemplateFile {
    constructor(template, platform = Platform_1.Platform.Both, shouldBeEvaluated = false) {
        this.template = template;
        this.platform = platform;
        this.shouldBeEvaluated = shouldBeEvaluated;
    }
    async copy(projectPath, outputPath) {
        return fs.copy((0, path_1.join)(Paths_1.SelfPath, 'templates', this.template, outputPath), (0, path_1.join)(projectPath, outputPath), {
            recursive: true,
        });
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
    constructor(userFilePath, platform = Platform_1.Platform.Both, shouldBeEvaluated = false) {
        this.userFilePath = userFilePath;
        this.platform = platform;
        this.shouldBeEvaluated = shouldBeEvaluated;
    }
    copy(projectPath, outputPath) {
        return fs.copy(this.userFilePath, (0, path_1.join)(projectPath, outputPath), {
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