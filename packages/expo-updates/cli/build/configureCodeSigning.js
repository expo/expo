#!/usr/bin/env node
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
exports.configureCodeSigning = void 0;
const chalk_1 = __importDefault(require("chalk"));
const args_1 = require("./utils/args");
const Log = __importStar(require("./utils/log"));
const configureCodeSigning = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--help': Boolean,
        '--certificate-input-directory': String,
        '--key-input-directory': String,
        '--keyid': String,
        // Aliases
        '-h': '--help',
    }, argv ?? []);
    if (args['--help']) {
        Log.exit((0, chalk_1.default) `
{bold Description}
Configure expo-updates code signing for this project and verify setup

{bold Usage}
  {dim $} npx expo-updates codesigning:configure --certificate-input-directory <dir> --key-input-directory <dir>

  Options
  --certificate-input-directory <string>     Directory containing code signing certificate
  --key-input-directory <string>             Directory containing private and public keys
  -h, --help                                 Output usage information
    `, 0);
    }
    const { configureCodeSigningAsync } = await import('./configureCodeSigningAsync.js');
    const certificateInput = (0, args_1.requireArg)(args, '--certificate-input-directory');
    const keyInput = (0, args_1.requireArg)(args, '--key-input-directory');
    const keyid = args['--keyid'];
    await configureCodeSigningAsync((0, args_1.getProjectRoot)(args), {
        certificateInput,
        keyInput,
        keyid,
    });
};
exports.configureCodeSigning = configureCodeSigning;
