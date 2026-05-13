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
exports.runCommand = void 0;
exports.parseAndValidateArgs = parseAndValidateArgs;
exports.resolveAndDispatch = resolveAndDispatch;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const tinyglobby_1 = require("tinyglobby");
const Log = __importStar(require("../log"));
const transforms_1 = require("../transforms");
const args_1 = require("../utils/args");
const runner_1 = require("../utils/runner");
const transformsBlock = (transforms) => ['', `  ${chalk_1.default.bold('Transforms available')}`, ...transforms.map((t) => `    ${t}`), ''].join('\n');
/**
 * Parse argv, validate it against the available transforms, and return the
 * resolved command. Prints help and exits when --help is passed or required
 * arguments are missing.
 */
async function parseAndValidateArgs(argv) {
    const { values, positionals } = (0, args_1.parseArgsOrExit)({
        args: argv,
        options: {
            help: { type: 'boolean', short: 'h' },
        },
        allowPositionals: true,
        strict: true,
    });
    const transforms = await (0, transforms_1.listTransformsAsync)();
    const [transform, ...paths] = positionals;
    if (values.help || !transform) {
        (0, args_1.printHelp)('Run a codemod transform against the given paths.', 'npx expo-codemod <transform> <paths...>', [
            '<transform>                   (required) name of transform to apply to files',
            '                              (see a list of transforms available below)',
            '<paths...>                    one or more paths or globs (e.g. src/**/*.tsx)',
            '-h, --help                    print this help message',
            '-v, --version                 print the CLI version',
        ].join('\n'), transformsBlock(transforms));
    }
    if (!transforms.includes(transform)) {
        Log.exit(`Transform "${transform}" does not exist. Valid options: ${transforms.join(', ')}`);
    }
    if (paths.length === 0) {
        Log.exit(`No paths provided to expo-codemod. Pass one or more file paths or globs to apply the "${transform}" transform to.\n` +
            `Example: npx expo-codemod ${transform} 'src/**/*.{ts,tsx,js,jsx}'\n` +
            `Run "npx expo-codemod --help" to see all options.`);
    }
    return { transform, paths };
}
/**
 * Expand the given paths into a file list and dispatch them to the jscodeshift
 * runner. Files are split by extension into the `tsx` and `jsx` parser buckets.
 */
async function resolveAndDispatch(command) {
    const { transform, paths } = command;
    const allFiles = await (0, tinyglobby_1.glob)(paths, {
        ignore: ['**/node_modules/**'],
    });
    const tsxFiles = [];
    const tsFiles = [];
    const jsxFiles = [];
    for (const file of allFiles) {
        const ext = path_1.default.extname(file);
        if (ext === '.tsx')
            tsxFiles.push(file);
        else if (ext === '.ts')
            tsFiles.push(file);
        else if (ext === '.js' || ext === '.jsx')
            jsxFiles.push(file);
    }
    const mappings = {
        ts: tsFiles,
        tsx: tsxFiles,
        jsx: jsxFiles,
    };
    const stats = await Promise.all(Object.entries(mappings)
        .filter(([_, files]) => files.length)
        .map(async ([parser, files]) => {
        Log.log(`Transforming ${files.length} ${parser.toUpperCase()} files...`);
        return await (0, runner_1.runTransformAsync)({
            files,
            parser: parser,
            transform,
        });
    }));
    const combinedStats = stats.reduce((acc, { error, ok, nochange, skip, timeElapsed }) => ({
        error: acc.error + error,
        ok: acc.ok + ok,
        nochange: acc.nochange + nochange,
        skip: acc.skip + skip,
        timeElapsed: Math.max(acc.timeElapsed, Number(timeElapsed)),
    }), { error: 0, ok: 0, nochange: 0, skip: 0, timeElapsed: 0 });
    Log.log('');
    Log.log('Results:');
    Log.log(chalk_1.default.red(`  ${combinedStats.error} errors`));
    // Log.log(chalk.yellow(`  ${combinedStats.nochange} unmodified`));
    Log.log(chalk_1.default.yellow(`  ${combinedStats.skip} skipped`));
    Log.log(chalk_1.default.green(`  ${combinedStats.ok} ok`));
    Log.log(`  Time elapsed: ${combinedStats.timeElapsed.toFixed(2)}s`);
}
const runCommand = async (argv) => {
    const command = await parseAndValidateArgs(argv);
    await resolveAndDispatch(command);
};
exports.runCommand = runCommand;
//# sourceMappingURL=index.js.map