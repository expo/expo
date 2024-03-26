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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapModule = void 0;
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const node_assert_1 = __importDefault(require("node:assert"));
const WRAP_NAME = '$$_REQUIRE'; // note: babel will prefix this with _
function wrapModule(fileAst, importDefaultName, importAllName, dependencyMapName, globalPrefix, skipRequireRename) {
    const params = buildParameters(importDefaultName, importAllName, dependencyMapName);
    const factory = functionFromProgram(fileAst.program, params);
    const def = t.callExpression(t.identifier(`${globalPrefix}__d`), [factory]);
    const ast = t.file(t.program([t.expressionStatement(def)]));
    // `require` doesn't need to be scoped when Metro serializes to iife because the local function
    // `require` will be used instead of the global one.
    const requireName = skipRequireRename ? 'require' : renameRequires(ast);
    return { ast, requireName };
}
exports.wrapModule = wrapModule;
function functionFromProgram(program, parameters) {
    return t.functionExpression(undefined, parameters.map((name) => t.identifier(name)), t.blockStatement(program.body, program.directives));
}
function buildParameters(importDefaultName, importAllName, dependencyMapName) {
    return [
        'global',
        'require',
        importDefaultName,
        importAllName,
        'module',
        'exports',
        dependencyMapName,
    ];
}
// Renaming requires should ideally only be done when generating for the target
// that expects the custom require name in the optimize step.
// This visitor currently renames all `require` references even if the module
// contains a custom `require` declaration. This should be fixed by only renaming
// if the `require` symbol hasn't been re-declared.
function renameRequires(ast) {
    let newRequireName = WRAP_NAME;
    (0, traverse_1.default)(ast, {
        Program(path) {
            const body = path.get('body.0.expression.arguments.0.body');
            (0, node_assert_1.default)(!Array.isArray(body), 'metro: Expected `body` to be a single path.');
            newRequireName = body.scope.generateUid(WRAP_NAME);
            body.scope.rename('require', newRequireName);
        },
    });
    return newRequireName;
}
//# sourceMappingURL=wrapModule.js.map