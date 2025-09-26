"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPosixPath = toPosixPath;
const node_path_1 = __importDefault(require("node:path"));
/** Convert any platform-specific path to a POSIX path.
 * @privateRemarks
 * Metro's equivalent is `normalizePathSeparatorsToPosix`
 */
function toPosixPath(filePath) {
    return node_path_1.default.sep === '\\' ? filePath.replaceAll('\\', '/') : filePath;
}
//# sourceMappingURL=filePath.js.map