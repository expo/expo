"use strict";
/* eslint-disable import/export */
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
exports.getAccountUsername = void 0;
__exportStar(require("./Config"), exports);
__exportStar(require("./Config.types"), exports);
__exportStar(require("./getExpoSDKVersion"), exports);
__exportStar(require("./Errors"), exports);
var getAccountUsername_1 = require("./getAccountUsername");
Object.defineProperty(exports, "getAccountUsername", { enumerable: true, get: function () { return getAccountUsername_1.getAccountUsername; } });
