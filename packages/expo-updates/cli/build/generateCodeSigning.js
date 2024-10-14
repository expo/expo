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
exports.generateCodeSigning = void 0;
const chalk_1 = __importDefault(require("chalk"));
const args_1 = require("./utils/args");
const Log = __importStar(require("./utils/log"));
const generateCodeSigning = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--help': Boolean,
        '--key-output-directory': String,
        '--certificate-output-directory': String,
        '--certificate-validity-duration-years': Number,
        '--certificate-common-name': String,
        // Aliases
        '-h': '--help',
    }, argv ?? []);
    if (args['--help']) {
        Log.exit((0, chalk_1.default) `
{bold Description}
Generate expo-updates private key, public key, and code signing certificate using that public key (self-signed by the private key)

{bold Usage}
  {dim $} npx expo-updates codesigning:generate --key-output-directory <dir> --certificate-output-directory <dir> --certificate-validity-duration-years <num years> --certificate-common-name <name>

  Options
  --key-output-directory <string>                  Directory in which to put the generated private and public keys
  --certificate-output-directory <string>          Directory in which to put the generated certificate
  --certificate-validity-duration-years <number>   Certificate validity duration in years (number of years before certificate needs rotation)
  --certificate-common-name <string>               Common name attribute for certificate (generally the human readable name of the organization owning this application)
  -h, --help                                       Output usage information
    `, 0);
    }
    const { generateCodeSigningAsync } = await import('./generateCodeSigningAsync.js');
    const keyOutput = (0, args_1.requireArg)(args, '--key-output-directory');
    const certificateOutput = (0, args_1.requireArg)(args, '--certificate-output-directory');
    const certificateValidityDurationYears = (0, args_1.requireArg)(args, '--certificate-validity-duration-years');
    const certificateCommonName = (0, args_1.requireArg)(args, '--certificate-common-name');
    await generateCodeSigningAsync((0, args_1.getProjectRoot)(args), {
        certificateValidityDurationYears,
        keyOutput,
        certificateOutput,
        certificateCommonName,
    });
};
exports.generateCodeSigning = generateCodeSigning;
