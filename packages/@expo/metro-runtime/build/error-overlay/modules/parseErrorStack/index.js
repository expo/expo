"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stacktrace_parser_1 = require("stacktrace-parser");
function parseErrorStack(stack) {
    if (stack == null) {
        return [];
    }
    if (Array.isArray(stack)) {
        return stack;
    }
    // Native support for parsing for non-standard Hermes stack traces.
    // @ts-expect-error: HermesInternal is not a global variable, but it is injected by the Hermes VM.
    if (global.HermesInternal) {
        return require("./parseHermesStack").parseErrorStack(stack);
    }
    return (0, stacktrace_parser_1.parse)(stack).map((frame) => {
        // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`
        return {
            ...frame,
            column: frame.column != null ? frame.column - 1 : null,
        };
    });
}
exports.default = parseErrorStack;
//# sourceMappingURL=index.js.map