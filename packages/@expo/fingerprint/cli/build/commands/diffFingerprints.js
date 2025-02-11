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
exports.diffFingerprintsAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const index_1 = require("../../../build/index");
const args_1 = require("../utils/args");
const errors_1 = require("../utils/errors");
const Log = __importStar(require("../utils/log"));
const readFingerprintFileAsync_1 = __importDefault(require("../utils/readFingerprintFileAsync"));
const diffFingerprintsAsync = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--help': Boolean,
        // Aliases
        '-h': '--help',
    }, argv ?? []);
    if (args['--help']) {
        Log.exit((0, chalk_1.default) `
{bold Description}
Diff two fingerprints

{bold Usage}
  {dim $} npx @expo/fingerprint fingerprint:diff <fingerprintFile1> <fingerprintFile2>

  Options
  -h, --help                           Output usage information
    `, 0);
    }
    const fingerprintFile1 = (0, args_1.getFileArgumentAtIndex)(args, 0);
    const fingerprintFile2 = (0, args_1.getFileArgumentAtIndex)(args, 1);
    const [fingerprint1ToDiff, fingerprint2ToDiff] = await Promise.all([
        (0, readFingerprintFileAsync_1.default)(fingerprintFile1),
        (0, readFingerprintFileAsync_1.default)(fingerprintFile2),
    ]);
    try {
        const diff = (0, index_1.diffFingerprints)(fingerprint1ToDiff, fingerprint2ToDiff);
        console.log(JSON.stringify(diff, null, 2));
    }
    catch (e) {
        throw new errors_1.CommandError(e.message);
    }
};
exports.diffFingerprintsAsync = diffFingerprintsAsync;
