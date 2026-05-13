"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformShim = transformShim;
const core_1 = require("@babel/core");
const generator_1 = __importDefault(require("@babel/generator"));
const JsFileWrapping = __importStar(require("@expo/metro/metro/ModuleGraph/worker/JsFileWrapping"));
const packedMap_1 = require("../serializer/packedMap");
/** Synthesizes the `metro-transform-worker` output for a hand-crafted JS shims
 *
 * Typically used to skip Babel for JS output that embeds CSS. The CSS files'
 * processing isn't cached in development, making invoking Babel on them very
 * expensive and unnecessary.
 *
 * Note that `body` must not contain requires/imports, and parse without
 * additional Babel syntax features enabled. It must also only reference
 * the default Metro module arguments or globals.
 */
function transformShim(config, filename, body) {
    const parsed = (0, core_1.parse)(body, {
        sourceType: 'unambiguous',
        babelrc: false,
        configFile: false,
        cloneInputAst: false,
    });
    if (parsed == null) {
        throw new Error(`transformShim could not parse the synthesized module body for ${filename}. ` +
            `This is a bug in @expo/metro-config — the shim path is only used for hand-crafted ` +
            `module bodies which should always parse with default Babel options.`);
    }
    const ast = parsed;
    const wrappedAst = config.unstable_disableModuleWrapping === true
        ? ast
        : JsFileWrapping.wrapModule(ast, '_$$_IMPORT_DEFAULT', '_$$_IMPORT_ALL', config.unstable_dependencyMapReservedName ?? 'dependencyMap', config.globalPrefix, config.unstable_renameRequire === false).ast;
    const { code } = (0, generator_1.default)(wrappedAst, {
        comments: false,
        compact: config.unstable_compactOutput ?? false,
        filename,
        retainLines: false,
        sourceMaps: false,
    });
    const map = (0, packedMap_1.emptySourceMap)();
    const { lineCount } = (0, packedMap_1.countLinesAndTerminateSourceMap)(code, map);
    const output = [
        {
            type: 'js/module',
            data: { code, functionMap: null, lineCount, map },
        },
    ];
    return { dependencies: [], output };
}
//# sourceMappingURL=transformShim.js.map