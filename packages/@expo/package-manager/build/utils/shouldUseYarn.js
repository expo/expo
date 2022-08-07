"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function shouldUseYarn() {
    var _a;
    try {
        if ((_a = process.env.npm_config_user_agent) === null || _a === void 0 ? void 0 : _a.startsWith('yarn')) {
            return true;
        }
        child_process_1.execSync('yarnpkg --version', { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.default = shouldUseYarn;
//# sourceMappingURL=shouldUseYarn.js.map