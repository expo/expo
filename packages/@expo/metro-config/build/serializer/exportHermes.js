"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHermesBundleAsync = void 0;
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
// Only one hermes build at a time is supported.
let currentHermesBuild = null;
async function buildHermesBundleAsync(options) {
    if (currentHermesBuild) {
        debug(`Waiting for existing Hermes builds to finish`);
        await currentHermesBuild;
    }
    currentHermesBuild = directlyBuildHermesBundleAsync(options);
    return await currentHermesBuild;
}
exports.buildHermesBundleAsync = buildHermesBundleAsync;
async function directlyBuildHermesBundleAsync({ code, map, minify = false, filename, }) {
    const tempDir = path_1.default.join(os_1.default.tmpdir(), `expo-bundler-${Math.random()}-${Date.now()}`);
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
        await fs_extra_1.default.remove(tempDir);
    }
}
async function createHermesSourcemapAsync(sourcemap, hermesMapFile) {
    const bundlerSourcemap = JSON.parse(sourcemap);
    const hermesSourcemap = await fs_extra_1.default.readJSON(hermesMapFile);
    return JSON.stringify((0, metro_source_map_1.composeSourceMaps)([bundlerSourcemap, hermesSourcemap]));
}
//# sourceMappingURL=exportHermes.js.map