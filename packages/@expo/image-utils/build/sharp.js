"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resizeBufferAsync = resizeBufferAsync;
exports.isAvailableAsync = isAvailableAsync;
exports.sharpAsync = sharpAsync;
exports.findSharpInstanceAsync = findSharpInstanceAsync;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const assert_1 = __importDefault(require("assert"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const resolve_global_1 = __importDefault(require("resolve-global"));
const semver_1 = __importDefault(require("semver"));
const env_1 = require("./env");
const SHARP_HELP_PATTERN = /\n\nSpecify --help for available options/g;
const SHARP_REQUIRED_VERSION = '^5.2.0';
async function resizeBufferAsync(buffer, sizes) {
    const sharp = await findSharpInstanceAsync();
    (0, assert_1.default)(sharp, 'Sharp is being used while its not initialized');
    const metadata = await sharp(buffer).metadata();
    // Create buffer for each size
    const resizedBuffers = await Promise.all(sizes.map((dimension) => {
        const density = metadata.density != null
            ? (dimension / Math.max(metadata.width, metadata.height)) * metadata.density
            : null;
        return sharp(buffer, {
            density: density == null ? undefined : Math.ceil(density),
        })
            .resize(dimension, dimension, { fit: 'contain', background: 'transparent' })
            .toBuffer();
    }));
    return resizedBuffers;
}
/**
 * Returns `true` if a global sharp instance can be found.
 * This functionality can be overridden with `process.env.EXPO_IMAGE_UTILS_NO_SHARP=1`.
 */
async function isAvailableAsync() {
    if (env_1.env.EXPO_IMAGE_UTILS_NO_SHARP) {
        return false;
    }
    try {
        // Attempt to find Sharp
        await findSharpInstanceAsync();
        // Only mark as available when both CLI and module are found
        return !!_sharpBin && !!_sharpInstance;
    }
    catch {
        return false;
    }
}
async function sharpAsync(options, commands = []) {
    const bin = await findSharpBinAsync();
    try {
        const { stdout } = await (0, spawn_async_1.default)(bin, [
            ...getOptions(options),
            ...getCommandOptions(commands),
        ]);
        const outputFilePaths = stdout.trim().split('\n');
        return outputFilePaths;
    }
    catch (error) {
        if (error.stderr) {
            throw new Error('\nProcessing images using sharp-cli failed: ' +
                error.message +
                '\nOutput: ' +
                error.stderr.replace(SHARP_HELP_PATTERN, ''));
        }
        else {
            throw error;
        }
    }
}
function getOptions(options) {
    const args = [];
    for (const [key, value] of Object.entries(options)) {
        if (value != null && value !== false) {
            if (typeof value === 'boolean') {
                args.push(`--${key}`);
            }
            else if (typeof value === 'number') {
                args.push(`--${key}`, value.toFixed());
            }
            else {
                args.push(`--${key}`, value);
            }
        }
    }
    return args;
}
function getCommandOptions(commands) {
    const args = [];
    for (const command of commands) {
        if (command.operation === 'resize') {
            const { operation, width, ...namedOptions } = command;
            args.push(operation, width.toFixed(), ...getOptions(namedOptions));
        }
        else {
            const { operation, ...namedOptions } = command;
            args.push(operation, ...getOptions(namedOptions));
        }
        args.push('--');
    }
    return args;
}
let _sharpBin = null;
let _sharpInstance = null;
async function findSharpBinAsync() {
    if (_sharpBin)
        return _sharpBin;
    try {
        const sharpCliPackagePath = resolve_global_1.default.silent('sharp-cli/package.json') ??
            require.resolve('sharp-cli/package.json', {
                paths: require.resolve.paths('sharp-cli') ?? undefined,
            });
        const sharpCliPackage = require(sharpCliPackagePath);
        const sharpInstance = sharpCliPackagePath
            ? require((0, resolve_from_1.default)(sharpCliPackagePath, 'sharp'))
            : null;
        if (sharpCliPackagePath &&
            semver_1.default.satisfies(sharpCliPackage.version, SHARP_REQUIRED_VERSION) &&
            typeof sharpCliPackage.bin.sharp === 'string' &&
            typeof _sharpInstance?.versions?.vips === 'string') {
            _sharpBin = path_1.default.join(path_1.default.dirname(sharpCliPackagePath), sharpCliPackage.bin.sharp);
            _sharpInstance = sharpInstance;
            return _sharpBin;
        }
    }
    catch (error) {
        _sharpBin = null;
        _sharpInstance = null;
        // `sharp-cli` and/or `sharp` modules could not be found, falling back to global binary only
        if (env_1.env.EXPO_IMAGE_UTILS_DEBUG) {
            console.warn('Sharp could not be loaded, reason:', error);
        }
    }
    let installedCliVersion;
    try {
        installedCliVersion = (await (0, spawn_async_1.default)('sharp', ['--version'])).stdout.toString().trim();
    }
    catch {
        return '';
    }
    if (!semver_1.default.satisfies(installedCliVersion, SHARP_REQUIRED_VERSION)) {
        showVersionMismatchWarning(SHARP_REQUIRED_VERSION, installedCliVersion);
        return '';
    }
    // Use the `sharp-cli` reference from PATH
    _sharpBin = 'sharp';
    return _sharpBin;
}
/**
 * Returns the instance of `sharp` installed by the global `sharp-cli` package.
 * This method will throw errors if the `sharp` instance cannot be found, these errors can be circumvented by ensuring `isAvailableAsync()` resolves to `true`.
 */
async function findSharpInstanceAsync() {
    if (env_1.env.EXPO_IMAGE_UTILS_NO_SHARP) {
        throw new Error('Global instance of sharp-cli cannot be retrieved because sharp-cli has been disabled with the environment variable `EXPO_IMAGE_UTILS_NO_SHARP`');
    }
    // Return the cached instance
    if (_sharpInstance)
        return _sharpInstance;
    // Resolve `sharp-cli` and `sharp`, this also loads the sharp module if it can be found
    await findSharpBinAsync();
    if (!_sharpInstance) {
        throw new Error(`Failed to find the instance of sharp used by the global sharp-cli package.`);
    }
    return _sharpInstance;
}
let versionMismatchWarningShown = false;
function showVersionMismatchWarning(requiredCliVersion, installedCliVersion) {
    if (versionMismatchWarningShown) {
        return;
    }
    console.warn([
        chalk_1.default.yellow(`Expo supports version "${requiredCliVersion}" of \`sharp-cli\`, current version: "${installedCliVersion}".`),
        chalk_1.default.yellow.dim(`If you can remove or upgrade using \`npm (un)install -g sharp-cli@${requiredCliVersion}\`.`),
        chalk_1.default.yellow.dim(`Or disable \`sharp-cli\` with \`EXPO_IMAGE_UTILS_NO_SHARP=1\`.`),
    ].join('\n'));
    versionMismatchWarningShown = true;
}
//# sourceMappingURL=sharp.js.map