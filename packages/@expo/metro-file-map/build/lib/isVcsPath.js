"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = isVcsPath;
const VCS_DIR_SEGMENT = /(?:^|[/\\])\.(?:git|hg)[/\\]/;
function isVcsPath(filePath) {
    return VCS_DIR_SEGMENT.test(filePath);
}
