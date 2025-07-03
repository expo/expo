"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.link = link;
const chalk_1 = __importDefault(require("chalk"));
const terminal_link_1 = __importDefault(require("terminal-link"));
/**
 * Prints a link for given URL, using text if provided, otherwise text is just the URL.
 * Format links as dim (unless disabled) and with an underline.
 *
 * @example https://expo.dev
 */
function link(url, { text = url, dim = true } = {}) {
    let output;
    // Links can be disabled via env variables https://github.com/jamestalmage/supports-hyperlinks/blob/master/index.js
    if (terminal_link_1.default.isSupported) {
        output = (0, terminal_link_1.default)(text, url);
    }
    else {
        output = `${text === url ? '' : text + ': '}${chalk_1.default.underline(url)}`;
    }
    return dim ? chalk_1.default.dim(output) : output;
}
//# sourceMappingURL=link.js.map