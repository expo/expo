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
exports.writeFileAtomic = exports.writeFileAtomicSync = void 0;
const node_crypto_1 = require("node:crypto");
const fs = __importStar(require("node:fs"));
function getTarget(filename, data) {
    const hash = (0, node_crypto_1.createHash)('sha256').update(data).digest('base64url');
    return `${filename}.${hash}`;
}
function writeFileAtomicSync(filename, data) {
    const tmpfile = getTarget(filename, data);
    fs.writeFileSync(tmpfile, data);
    fs.renameSync(tmpfile, filename);
}
exports.writeFileAtomicSync = writeFileAtomicSync;
async function writeFileAtomic(filename, data) {
    const tmpfile = getTarget(filename, data);
    await fs.promises.writeFile(tmpfile, data);
    await fs.promises.rename(tmpfile, filename);
}
exports.writeFileAtomic = writeFileAtomic;
//# sourceMappingURL=writeAtomic.js.map