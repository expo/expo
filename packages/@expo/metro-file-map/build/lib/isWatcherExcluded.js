"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = isWatcherExcluded;
const EXCLUDED_DIR_SEGMENT = /(?:^|[/\\])\.(?:git|hg|cxx)[/\\]/;
function isWatcherExcluded(filePath) {
    return EXCLUDED_DIR_SEGMENT.test(filePath);
}
