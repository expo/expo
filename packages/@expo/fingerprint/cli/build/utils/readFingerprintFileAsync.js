"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
async function readFingerprintFileAsync(path) {
    try {
        return JSON.parse(await promises_1.default.readFile(path, 'utf-8'));
    }
    catch (e) {
        throw new Error(`Unable to read fingerprint file ${path}: ${e.message}`);
    }
}
exports.default = readFingerprintFileAsync;
