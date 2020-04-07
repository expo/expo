#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("@expo/commander"));
const chalk_1 = __importDefault(require("chalk"));
const color_string_1 = __importDefault(require("color-string"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const configureAndroidSplashScreen_1 = __importDefault(require("./configureAndroidSplashScreen"));
const configureIosSplashScreen_1 = __importDefault(require("./configureIosSplashScreen"));
const constants_1 = require("./constants");
async function action(configuration) {
    const { platform, ...restParams } = configuration;
    switch (platform) {
        case constants_1.Platform.ANDROID:
            await configureAndroidSplashScreen_1.default(restParams);
            break;
        case constants_1.Platform.IOS:
            await configureIosSplashScreen_1.default(restParams);
            break;
        case constants_1.Platform.ALL:
        default:
            await configureAndroidSplashScreen_1.default(restParams);
            await configureIosSplashScreen_1.default(restParams);
            break;
    }
}
function getAvailableOptions(o) {
    return Object.values(o)
        .map(v => chalk_1.default.dim.cyan(v))
        .join(' | ');
}
/**
 * Ensures following semantic requirements are met:
 * @param configuration.imagePath path that points to a valid .png file
 * @param configuration.resizeMode ResizeMode.NATIVE is selected only with Platform.ANDROID
 * @param configuration.backgroundColor is valid hex #RGB/#RGBA color
 */
async function validateConfiguration(configuration) {
    const { resizeMode, imagePath: imagePathString, platform } = configuration;
    // check for `native` resizeMode being selected only for `android` platform
    if (resizeMode === constants_1.ResizeMode.NATIVE && platform !== constants_1.Platform.ANDROID) {
        console.log(chalk_1.default.red(`\nInvalid ${chalk_1.default.magenta('platform')} ${chalk_1.default.yellow(platform)} selected for ${chalk_1.default.magenta('resizeMode')} ${chalk_1.default.yellow(resizeMode)}. See below for the valid options configuration.\n`));
        commander_1.default.help();
    }
    if (imagePathString) {
        const imagePath = path_1.default.resolve(imagePathString);
        // check if `imagePath` exists
        if (!(await fs_extra_1.default.pathExists(imagePath))) {
            chalk_1.default.red(`\nNo such file ${chalk_1.default.yellow(imagePathString)}. Provide path to a valid .png file.\n`);
            commander_1.default.help();
        }
        // check if `imagePath` is a readable .png file
        if (path_1.default.extname(imagePath) !== '.png') {
            console.log(chalk_1.default.red(`\nProvided ${chalk_1.default.yellow(imagePathString)} file is not a .png file. Provide path to a valid .png file.\n`));
            commander_1.default.help();
        }
    }
    const backgroundColor = color_string_1.default.get(configuration.backgroundColor);
    if (!backgroundColor) {
        console.log(chalk_1.default.red(`\nProvided invalid argument ${chalk_1.default.yellow(configuration.backgroundColor)} as backgroundColor. See below for available formats for this argument.\n`));
        commander_1.default.help();
    }
    return {
        ...configuration,
        backgroundColor: color_string_1.default.to.hex(backgroundColor.value),
    };
}
async function runAsync() {
    commander_1.default
        .arguments('<backgroundColor> [imagePath]')
        .description('Idempotent operation that configures native splash screens using passed .png file that would be used in native splash screen.', {
        backgroundColor: `(${chalk_1.default.dim.red('required')}) Valid css-formatted color (hex (#RRGGBB[AA]), rgb[a], hsl[a], named color (https://drafts.csswg.org/css-color/#named-colors)) that would be used as background color for native splash screen view.`,
        imagePath: `(${chalk_1.default.dim.yellow('optional')}) Path to a valid .png image.`,
    })
        .allowUnknownOption(false)
        .option('-r, --resize-mode [resizeMode]', `ResizeMode to be used for native splash screen image. Available values: ${getAvailableOptions(constants_1.ResizeMode)} (${chalk_1.default.yellow.dim(`only available for ${chalk_1.default.cyan.dim('android')} platform)`)}).`, (userInput) => {
        if (!Object.values(constants_1.ResizeMode).includes(userInput)) {
            console.log(chalk_1.default.red(`\nUnknown value ${chalk_1.default.yellow(userInput)} for option ${chalk_1.default.magenta('resizeMode')}. See below for the available values for this option.\n`));
            commander_1.default.help();
        }
        return userInput;
    }, constants_1.ResizeMode.CONTAIN)
        .option('-p, --platform [platform]', `Selected platform to configure. Available values: ${getAvailableOptions(constants_1.Platform)}.`, (userInput) => {
        if (!Object.values(constants_1.Platform).includes(userInput)) {
            console.log(chalk_1.default.red(`\nUnknown value ${chalk_1.default.yellow(userInput)} for option ${chalk_1.default.magenta('platform')}. See below for the available values for this option.\n`));
            commander_1.default.help();
        }
        return userInput;
    }, constants_1.Platform.ALL)
        .asyncAction(async (backgroundColor, imagePath, { resizeMode, platform }) => {
        const configuration = { imagePath, backgroundColor, resizeMode, platform };
        const validatedConfiguration = await validateConfiguration(configuration);
        await action(validatedConfiguration);
    });
    commander_1.default.parse(process.argv);
    // With no argument passed command should prompt user about wrong usage
    if (commander_1.default.args.length === 0) {
        console.log(chalk_1.default.red(`\nMissing argument ${chalk_1.default.yellow.dim('backgroundColor')}. See below for the required arguments.\n`));
        commander_1.default.help();
    }
}
async function run() {
    await runAsync().catch(e => {
        console.error(chalk_1.default.red('Uncaught error:'), chalk_1.default.red(e.message));
        process.exit(1);
    });
}
run();
//# sourceMappingURL=configure.js.map