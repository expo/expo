"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const ERROR_PREFIX = 'Error: ';
class CommandError extends Error {
    constructor(code, message = ''){
        super('');
        this.name = 'CommandError';
        this.isCommandError = true;
        // If e.toString() was called to get `message` we don't want it to look
        // like "Error: Error:".
        if (message.startsWith(ERROR_PREFIX)) {
            message = message.substring(ERROR_PREFIX.length);
        }
        this.message = message || code;
        this.code = code;
    }
}
exports.CommandError = CommandError;

//# sourceMappingURL=errors.js.map