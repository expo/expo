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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJSXIntrinsicsFileContent = exports.generateViewTypesFileContent = exports.generateModuleTypesFileContent = exports.generateFullTsInterface = exports.generateConciseTsInterface = exports.getAllExpoModulesInWorkingDirectory = exports.generateMocks = void 0;
__exportStar(require("./typeInformation"), exports);
var mockgen_1 = require("./mockgen");
Object.defineProperty(exports, "generateMocks", { enumerable: true, get: function () { return mockgen_1.generateMocks; } });
Object.defineProperty(exports, "getAllExpoModulesInWorkingDirectory", { enumerable: true, get: function () { return mockgen_1.getAllExpoModulesInWorkingDirectory; } });
var typescriptGeneration_1 = require("./typescriptGeneration");
Object.defineProperty(exports, "generateConciseTsInterface", { enumerable: true, get: function () { return typescriptGeneration_1.generateConciseTsInterface; } });
Object.defineProperty(exports, "generateFullTsInterface", { enumerable: true, get: function () { return typescriptGeneration_1.generateFullTsInterface; } });
Object.defineProperty(exports, "generateModuleTypesFileContent", { enumerable: true, get: function () { return typescriptGeneration_1.generateModuleTypesFileContent; } });
Object.defineProperty(exports, "generateViewTypesFileContent", { enumerable: true, get: function () { return typescriptGeneration_1.generateViewTypesFileContent; } });
Object.defineProperty(exports, "generateJSXIntrinsicsFileContent", { enumerable: true, get: function () { return typescriptGeneration_1.generateJSXIntrinsicsFileContent; } });
//# sourceMappingURL=index.js.map