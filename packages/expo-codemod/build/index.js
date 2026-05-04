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
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const Log = __importStar(require("./log"));
async function main() {
    const argv = process.argv.slice(2);
    // strict:false so unknown flags pass through to the inner runCommand parser,
    // which owns the strict validation.
    const { values } = (0, util_1.parseArgs)({
        args: argv,
        options: {
            version: { type: 'boolean', short: 'v' },
        },
        allowPositionals: true,
        strict: false,
    });
    if (values.version) {
        // After build, this file is at build/index.js, so the package root is one level up.
        const pkg = require(path_1.default.resolve(__dirname, '..', 'package.json'));
        Log.log(pkg.version);
        process.exit(0);
    }
    const { runCommand } = await import('./run/index.js');
    await runCommand(argv);
}
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    Log.error(message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map