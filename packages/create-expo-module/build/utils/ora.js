"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newStep = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
async function newStep(title, action, options = {}) {
    const disabled = process.env.CI || process.env.EXPO_DEBUG;
    const step = (0, ora_1.default)({
        text: chalk_1.default.bold(title),
        isEnabled: !disabled,
        stream: disabled ? process.stdout : process.stderr,
        ...options,
    });
    step.start();
    try {
        return await action(step);
    }
    catch (error) {
        step.fail();
        console.error(error);
        process.exit(1);
    }
}
exports.newStep = newStep;
//# sourceMappingURL=ora.js.map