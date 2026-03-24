"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const COCOAPODS_MANGLE_GEM = "gem 'cocoapods-mangle'";
const withGemfilePlugin = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const gemfilePath = node_path_1.default.join(config.modRequest.projectRoot, 'Gemfile');
            if (!node_fs_1.default.existsSync(gemfilePath)) {
                console.warn('No Gemfile found in the project root. Skipping cocoapods-mangle gem addition. ' +
                    "Please add `gem 'cocoapods-mangle'` to your Gemfile manually.");
                return config;
            }
            let contents = await node_fs_1.default.promises.readFile(gemfilePath, 'utf-8');
            if (contents.includes('cocoapods-mangle')) {
                return config;
            }
            // Add the gem after the last existing gem line, or at the end
            const lines = contents.split('\n');
            const lastGemIndex = lines.reduce((acc, line, index) => {
                if (line.trimStart().startsWith('gem ')) {
                    return index;
                }
                return acc;
            }, -1);
            if (lastGemIndex >= 0) {
                lines.splice(lastGemIndex + 1, 0, COCOAPODS_MANGLE_GEM);
            }
            else {
                lines.push(COCOAPODS_MANGLE_GEM);
            }
            await node_fs_1.default.promises.writeFile(gemfilePath, lines.join('\n'));
            return config;
        },
    ]);
};
exports.default = withGemfilePlugin;
