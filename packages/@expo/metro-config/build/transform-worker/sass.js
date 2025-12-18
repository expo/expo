"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchSass = matchSass;
exports.compileSass = compileSass;
const resolve_from_1 = __importDefault(require("resolve-from"));
let sassInstance = null;
// TODO(@kitten): Add optional peer for `sass` instead
function getSassInstance(projectRoot) {
    if (!sassInstance) {
        const sassPath = resolve_from_1.default.silent(projectRoot, 'sass');
        if (!sassPath) {
            throw new Error(`Cannot parse Sass files without the module 'sass' installed. Run 'yarn add sass' and try again.`);
        }
        sassInstance = require(sassPath);
    }
    return sassInstance;
}
function matchSass(filename) {
    if (filename.endsWith('.sass')) {
        return 'indented';
    }
    else if (filename.endsWith('.scss')) {
        return 'scss';
    }
    return null;
}
function compileSass(projectRoot, { src }, options) {
    const sass = getSassInstance(projectRoot);
    const result = sass.compileString(src, options);
    return {
        src: result.css,
        // NOTE(@kitten): Types won't match up, but we're aware of the format from SASS matching
        map: result.sourceMap,
    };
}
//# sourceMappingURL=sass.js.map