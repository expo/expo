"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
class ConfigReader {
    constructor(path) {
        this.path = path;
    }
    readConfigFile() {
        return require(this.path);
    }
    static getFilePath(path) {
        return path ? path : (0, path_1.join)(process.cwd(), 'test-runner.config.js');
    }
}
exports.default = ConfigReader;
//# sourceMappingURL=ConfigReader.js.map