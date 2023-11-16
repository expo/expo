"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolvedLocalesAsync = exports.setLocalesAsync = exports.getLocales = exports.withLocales = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const ios_plugins_1 = require("../plugins/ios-plugins");
const warnings_1 = require("../utils/warnings");
const withLocales = (config) => {
    return (0, ios_plugins_1.withXcodeProject)(config, async (config) => {
        config.modResults = await setLocalesAsync(config, {
            projectRoot: config.modRequest.projectRoot,
            project: config.modResults,
        });
        return config;
    });
};
exports.withLocales = withLocales;
function getLocales(config) {
    return config.locales ?? null;
}
exports.getLocales = getLocales;
async function setLocalesAsync(config, { projectRoot, project }) {
    const locales = getLocales(config);
    if (!locales) {
        return project;
    }
    // possibly validate CFBundleAllowMixedLocalizations is enabled
    const localesMap = await getResolvedLocalesAsync(projectRoot, locales);
    const projectName = (0, Xcodeproj_1.getProjectName)(projectRoot);
    const supportingDirectory = (0, path_1.join)(projectRoot, 'ios', projectName, 'Supporting');
    // TODO: Should we delete all before running? Revisit after we land on a lock file.
    const stringName = 'InfoPlist.strings';
    for (const [lang, localizationObj] of Object.entries(localesMap)) {
        const dir = (0, path_1.join)(supportingDirectory, `${lang}.lproj`);
        // await fs.ensureDir(dir);
        await fs_1.default.promises.mkdir(dir, { recursive: true });
        const strings = (0, path_1.join)(dir, stringName);
        const buffer = [];
        for (const [plistKey, localVersion] of Object.entries(localizationObj)) {
            buffer.push(`${plistKey} = "${localVersion}";`);
        }
        // Write the file to the file system.
        await fs_1.default.promises.writeFile(strings, buffer.join('\n'));
        const groupName = `${projectName}/Supporting/${lang}.lproj`;
        // deep find the correct folder
        const group = (0, Xcodeproj_1.ensureGroupRecursively)(project, groupName);
        // Ensure the file doesn't already exist
        if (!group?.children.some(({ comment }) => comment === stringName)) {
            // Only write the file if it doesn't already exist.
            project = (0, Xcodeproj_1.addResourceFileToGroup)({
                filepath: (0, path_1.relative)(supportingDirectory, strings),
                groupName,
                project,
                isBuildFile: true,
                verbose: true,
            });
        }
    }
    return project;
}
exports.setLocalesAsync = setLocalesAsync;
async function getResolvedLocalesAsync(projectRoot, input) {
    const locales = {};
    for (const [lang, localeJsonPath] of Object.entries(input)) {
        if (typeof localeJsonPath === 'string') {
            try {
                locales[lang] = await json_file_1.default.readAsync((0, path_1.join)(projectRoot, localeJsonPath));
            }
            catch {
                // Add a warning when a json file cannot be parsed.
                (0, warnings_1.addWarningIOS)(`locales.${lang}`, `Failed to parse JSON of locale file for language: ${lang}`, 'https://docs.expo.dev/distribution/app-stores/#localizing-your-ios-app');
            }
        }
        else {
            // In the off chance that someone defined the locales json in the config, pass it directly to the object.
            // We do this to make the types more elegant.
            locales[lang] = localeJsonPath;
        }
    }
    return locales;
}
exports.getResolvedLocalesAsync = getResolvedLocalesAsync;
