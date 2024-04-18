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
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const semver_1 = __importDefault(require("semver"));
const env_1 = require("./env");
const SHARP_HELP_PATTERN = /\n\nSpecify --help for available options/g;
const SHARP_REQUIRED_VERSION = '^2.1.0';
async function resizeBufferAsync(buffer, sizes) {
    const sharp = await findSharpInstanceAsync();
    const metadata = await sharp(buffer).metadata();
    // Create buffer for each size
    const resizedBuffers = await Promise.all(sizes.map((dimension) => {
        const density = (dimension / Math.max(metadata.width, metadata.height)) * metadata.density;
        return sharp(buffer, {
            density: isNaN(density) ? undefined : Math.ceil(density),
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
        return !!(await findSharpBinAsync());
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
    if (_sharpBin) {
        return _sharpBin;
    }
    try {
        const sharpCliPackage = require('sharp-cli/package.json');
        const libVipsVersion = require('sharp').versions.vips;
        if (sharpCliPackage &&
            semver_1.default.satisfies(sharpCliPackage.version, SHARP_REQUIRED_VERSION) &&
            typeof sharpCliPackage.bin.sharp === 'string' &&
            typeof libVipsVersion === 'string') {
            _sharpBin = require.resolve(`sharp-cli/${sharpCliPackage.bin.sharp}`);
            return _sharpBin;
        }
    }
    catch {
        // fall back to global sharp-cli
    }
    let installedCliVersion;
    try {
        installedCliVersion = (await (0, spawn_async_1.default)('sharp', ['--version'])).stdout.toString().trim();
    }
    catch {
        throw notFoundError(SHARP_REQUIRED_VERSION);
    }
    if (!semver_1.default.satisfies(installedCliVersion, SHARP_REQUIRED_VERSION)) {
        showVersionMismatchWarning(SHARP_REQUIRED_VERSION, installedCliVersion);
    }
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
    if (_sharpInstance) {
        return _sharpInstance;
    }
    // Ensure sharp-cli version is correct
    await findSharpBinAsync();
    // Attempt to use local sharp package
    try {
        const sharp = require('sharp');
        _sharpInstance = sharp;
        return sharp;
    }
    catch { }
    // Attempt to resolve the sharp instance used by the global CLI
    let sharpCliPath;
    if (process.platform !== 'win32') {
        try {
            sharpCliPath = (await (0, spawn_async_1.default)('which', ['sharp'])).stdout.toString().trim();
        }
        catch { }
    }
    else {
        // On Windows systems, nested dependencies aren't linked to the paths within `require.resolve.paths`.
        // Yarn installs these modules in a different folder, let's add yarn to the other attempts.
        // See: https://github.com/expo/expo-cli/issues/2708
        let yarnGlobalPath = '';
        try {
            yarnGlobalPath = path_1.default.join((await (0, spawn_async_1.default)('yarn', ['global', 'dir'])).stdout.toString().trim(), 'node_modules');
        }
        catch { }
        try {
            sharpCliPath = require.resolve('sharp-cli/package.json', {
                paths: (require.resolve.paths('sharp-cli') || []).concat(yarnGlobalPath),
            });
        }
        catch { }
    }
    // resolve sharp from the sharp-cli package
    const sharpPath = resolve_from_1.default.silent(sharpCliPath || '', 'sharp');
    if (sharpPath) {
        try {
            // attempt to require the global sharp package
            _sharpInstance = require(sharpPath);
        }
        catch { }
    }
    if (!_sharpInstance) {
        throw new Error(`Failed to find the instance of sharp used by the global sharp-cli package.`);
    }
    return _sharpInstance;
}
function notFoundError(requiredCliVersion) {
    return new Error(`This command requires version ${requiredCliVersion} of \`sharp-cli\`. \n` +
        `You can install it using \`npm install -g sharp-cli@${requiredCliVersion}\`. \n` +
        '\n' +
        'For prerequisites, see: https://sharp.dimens.io/en/stable/install/#prerequisites');
}
let versionMismatchWarningShown = false;
function showVersionMismatchWarning(requiredCliVersion, installedCliVersion) {
    if (versionMismatchWarningShown) {
        return;
    }
    console.warn(`Warning: This command requires version ${requiredCliVersion} of \`sharp-cli\`. \n` +
        `Currently installed version: "${installedCliVersion}" \n` +
        `Required version: "${requiredCliVersion}" \n` +
        `You can install it using \`npm install -g sharp-cli@${requiredCliVersion}\`. \n` +
        '\n' +
        'For prerequisites, see: https://sharp.dimens.io/en/stable/install/#prerequisites');
    versionMismatchWarningShown = true;
}
//# sourceMappingURL=sharp.js.map