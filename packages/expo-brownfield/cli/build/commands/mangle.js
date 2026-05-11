"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const mangle_1 = require("../utils/mangle");
const readContext = (options) => {
    let raw;
    if (options.contextFile) {
        raw = node_fs_1.default.readFileSync(options.contextFile, 'utf8');
    }
    else if (options.contextJson) {
        raw = options.contextJson;
    }
    else {
        throw new Error('expo-brownfield mangle: missing --context-json or --context-file. ' +
            'This command is normally invoked from the Ruby shim during `pod install`.');
    }
    return JSON.parse(raw);
};
/**
 * Internal command spawned by `scripts/ios/mangle.rb` from a Podfile's
 * `post_install` block when the `multipleFrameworks` plugin option is set.
 * Not intended for direct user invocation.
 *
 * Exits with code 1 on any failure with a single-line error message — the
 * Ruby shim surfaces this back to CocoaPods. Without this catch the rejected
 * promise bubbles up to Node's unhandled-rejection handler and prints a noisy
 * stack trace that obscures the actual build failure.
 */
const mangle = async (command) => {
    try {
        const options = command.opts();
        const context = readContext(options);
        await (0, mangle_1.runMangle)(context, { verbose: options.verbose ?? false });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`expo-brownfield mangle: ${message}`);
        process.exit(1);
    }
};
exports.default = mangle;
//# sourceMappingURL=mangle.js.map