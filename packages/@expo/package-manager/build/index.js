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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isYarnOfflineAsync = exports.shouldUseYarn = exports.PnpmPackageManager = void 0;
__exportStar(require("./PackageManager"), exports);
__exportStar(require("./NodePackageManagers"), exports);
var PnpmPackageManager_1 = require("./PnpmPackageManager");
Object.defineProperty(exports, "PnpmPackageManager", { enumerable: true, get: function () { return PnpmPackageManager_1.PnpmPackageManager; } });
__exportStar(require("./CocoaPodsPackageManager"), exports);
var shouldUseYarn_1 = require("./utils/shouldUseYarn");
Object.defineProperty(exports, "shouldUseYarn", { enumerable: true, get: function () { return __importDefault(shouldUseYarn_1).default; } });
var isYarnOfflineAsync_1 = require("./utils/isYarnOfflineAsync");
Object.defineProperty(exports, "isYarnOfflineAsync", { enumerable: true, get: function () { return __importDefault(isYarnOfflineAsync_1).default; } });
__exportStar(require("./utils/nodeWorkspaces"), exports);
//# sourceMappingURL=index.js.map