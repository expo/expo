"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHermesBytecodeBundleVersionAsync = exports.isHermesBytecodeBundleAsync = exports.parseGradleProperties = exports.createHermesSourcemapAsync = exports.buildHermesBundleAsync = exports.isEnableHermesManaged = exports.importHermesCommandFromProject = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const metro_source_map_1 = require("metro-source-map");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const debug = require('debug')('expo:metro:hermes');
function importHermesCommandFromProject() {
    const platformExecutable = getHermesCommandPlatform();
    const hermescLocations = [
        // Override hermesc dir by environment variables
        process_1.default.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']
            ? `${process_1.default.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']}/build/bin/hermesc`
            : '',
        // Building hermes from source
        'react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc',
        // Prebuilt hermesc in official react-native 0.69+
        `react-native/sdks/hermesc/${platformExecutable}`,
        // Legacy hermes-engine package
        `hermes-engine/${platformExecutable}`,
    ];
    for (const location of hermescLocations) {
        try {
            return require.resolve(location);
        }
        catch { }
    }
    throw new Error('Cannot find the hermesc executable.');
}
exports.importHermesCommandFromProject = importHermesCommandFromProject;
function getHermesCommandPlatform() {
    switch (os_1.default.platform()) {
        case 'darwin':
            return 'osx-bin/hermesc';
        case 'linux':
            return 'linux64-bin/hermesc';
        case 'win32':
            return 'win64-bin/hermesc.exe';
        default:
            throw new Error(`Unsupported host platform for Hermes compiler: ${os_1.default.platform()}`);
    }
}
function isEnableHermesManaged(expoConfig, platform) {
    switch (platform) {
        case 'android': {
            return (expoConfig.android?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
        }
        case 'ios': {
            return (expoConfig.ios?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
        }
        default:
            return false;
    }
}
exports.isEnableHermesManaged = isEnableHermesManaged;
async function buildHermesBundleAsync({ code, map, minify = false, filename, }) {
    const tempDir = path_1.default.join(os_1.default.tmpdir(), `expo-bundler-${process_1.default.pid}`);
    await fs_extra_1.default.ensureDir(tempDir);
    try {
        const tempBundleFile = path_1.default.join(tempDir, 'index.js');
        await fs_extra_1.default.writeFile(tempBundleFile, code);
        if (map) {
            const tempSourcemapFile = path_1.default.join(tempDir, 'index.js.map');
            await fs_extra_1.default.writeFile(tempSourcemapFile, map);
        }
        const tempHbcFile = path_1.default.join(tempDir, 'index.hbc');
        const hermesCommand = importHermesCommandFromProject();
        const args = ['-emit-binary', '-out', tempHbcFile, tempBundleFile];
        if (minify) {
            args.push('-O');
        }
        if (map) {
            args.push('-output-source-map');
        }
        debug(`Running hermesc: ${hermesCommand} ${args.join(' ')}`);
        await (0, spawn_async_1.default)(hermesCommand, args);
        let hbc;
        let sourcemap = null;
        if (!map) {
            hbc = await fs_extra_1.default.readFile(tempHbcFile);
        }
        else {
            [hbc, sourcemap] = await Promise.all([
                fs_extra_1.default.readFile(tempHbcFile),
                createHermesSourcemapAsync(map, `${tempHbcFile}.map`),
            ]);
        }
        return {
            hbc,
            sourcemap,
        };
    }
    catch (error) {
        console.error(chalk_1.default.red(`\nFailed to generate Hermes bytecode for: ${filename}`));
        if ('status' in error) {
            console.error(error.output.join('\n'));
        }
        throw error;
    }
    finally {
        // await fs.remove(tempDir);
    }
}
exports.buildHermesBundleAsync = buildHermesBundleAsync;
async function createHermesSourcemapAsync(sourcemap, hermesMapFile) {
    const bundlerSourcemap = JSON.parse(sourcemap);
    const hermesSourcemap = await fs_extra_1.default.readJSON(hermesMapFile);
    return JSON.stringify((0, metro_source_map_1.composeSourceMaps)([bundlerSourcemap, hermesSourcemap]));
}
exports.createHermesSourcemapAsync = createHermesSourcemapAsync;
function parseGradleProperties(content) {
    const result = {};
    for (let line of content.split('\n')) {
        line = line.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }
        const sepIndex = line.indexOf('=');
        const key = line.substr(0, sepIndex);
        const value = line.substr(sepIndex + 1);
        result[key] = value;
    }
    return result;
}
exports.parseGradleProperties = parseGradleProperties;
// https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
const HERMES_MAGIC_HEADER = 'c61fbc03c103191f';
async function isHermesBytecodeBundleAsync(file) {
    const header = await readHermesHeaderAsync(file);
    return header.slice(0, 8).toString('hex') === HERMES_MAGIC_HEADER;
}
exports.isHermesBytecodeBundleAsync = isHermesBytecodeBundleAsync;
async function getHermesBytecodeBundleVersionAsync(file) {
    const header = await readHermesHeaderAsync(file);
    if (header.slice(0, 8).toString('hex') !== HERMES_MAGIC_HEADER) {
        throw new Error('Invalid hermes bundle file');
    }
    return header.readUInt32LE(8);
}
exports.getHermesBytecodeBundleVersionAsync = getHermesBytecodeBundleVersionAsync;
async function readHermesHeaderAsync(file) {
    const fd = await fs_extra_1.default.open(file, 'r');
    const buffer = Buffer.alloc(12);
    await fs_extra_1.default.read(fd, buffer, 0, 12, null);
    await fs_extra_1.default.close(fd);
    return buffer;
}
async function parsePodfilePropertiesAsync(podfilePropertiesPath) {
    try {
        return JSON.parse(await fs_extra_1.default.readFile(podfilePropertiesPath, 'utf8'));
    }
    catch {
        return {};
    }
}
