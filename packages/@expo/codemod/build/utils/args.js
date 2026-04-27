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
exports.parseArgsOrExit = parseArgsOrExit;
exports.printHelp = printHelp;
const chalk_1 = __importDefault(require("chalk"));
const util_1 = require("util");
const Log = __importStar(require("../log"));
const isParseArgsError = (error) => {
    if (!error || typeof error !== 'object' || !('code' in error))
        return false;
    const code = error.code;
    return typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS_');
};
function parseArgsOrExit(config) {
    try {
        return (0, util_1.parseArgs)(config);
    }
    catch (error) {
        if (isParseArgsError(error)) {
            Log.exit(error.message, 1);
        }
        throw error;
    }
}
function printHelp(info, usage, options, extra = '') {
    Log.exit((0, chalk_1.default) `
  {bold Info}
    ${info}

  {bold Usage}
    {dim $} ${usage}

  {bold Options}
    ${options.split('\n').join('\n    ')}
` + extra, 0);
}
//# sourceMappingURL=args.js.map