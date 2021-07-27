"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIdFromFilePath = void 0;
var crypto_1 = __importDefault(require("crypto"));
// TODO - figure out the best way to generate a pure id from filepath
//  needs to be a string with valid JS characters
function generateIdFromFilePath(filePath) {
    var id = crypto_1.default
        .createHash('sha256')
        .update(filePath)
        .digest('base64');
    id = id.replace(/[^a-zA-Z_]/gi, '');
    return id;
}
exports.generateIdFromFilePath = generateIdFromFilePath;
//# sourceMappingURL=generateIdFromFilePath.js.map