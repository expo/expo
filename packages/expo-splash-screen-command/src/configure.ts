#!/usr/bin/env node

import program from '@expo/commander';
import chalk from 'chalk';
import colorString from 'color-string';
import fs from 'fs-extra';
import path from 'path';

import configureAndroidSplashScreen from './configureAndroidSplashScreen';
import configureIosSplashScreen from './configureIosSplashScreen';
import { ResizeMode, Platform } from './constants';

/**
 * These parameters have to be provided by the user or omitted if possible.
 */
interface Params {
  backgroundColor: string;
  imagePath: string | undefined;
}

/**
 * These might be optionally provided by the user. There are default values for them.
 */
interface Options {
  resizeMode: ResizeMode;
  platform: Platform;
}

async function action(configuration: Params & Options) {
  const { platform, ...restParams } = configuration;
  switch (platform) {
    case Platform.ANDROID:
      await configureAndroidSplashScreen(restParams);
      break;
    case Platform.IOS:
      await configureIosSplashScreen(restParams);
      break;
    case Platform.ALL:
    default:
      await configureAndroidSplashScreen(restParams);
      await configureIosSplashScreen(restParams);
      break;
  }
}

function getAvailableOptions(o: object) {
  return Object.values(o)
    .map(v => chalk.dim.cyan(v))
    .join(' | ');
}

/**
 * Ensures following semantic requirements are met:
 * @param configuration.imagePath path that points to a valid .png file
 * @param configuration.resizeMode ResizeMode.NATIVE is selected only with Platform.ANDROID
 * @param configuration.backgroundColor is valid hex #RGB/#RGBA color
 */
async function validateConfiguration(
  configuration: Options & Params
): never | Promise<Options & Params> {
  const { resizeMode, imagePath: imagePathString, platform } = configuration;

  // check for `native` resizeMode being selected only for `android` platform
  if (resizeMode === ResizeMode.NATIVE && platform !== Platform.ANDROID) {
    console.log(
      chalk.red(
        `\nInvalid ${chalk.magenta('platform')} ${chalk.yellow(
          platform
        )} selected for ${chalk.magenta('resizeMode')} ${chalk.yellow(
          resizeMode
        )}. See below for the valid options configuration.\n`
      )
    );
    program.help();
  }

  if (imagePathString) {
    const imagePath = path.resolve(imagePathString);
    // check if `imagePath` exists
    if (!(await fs.pathExists(imagePath))) {
      chalk.red(
        `\nNo such file ${chalk.yellow(imagePathString)}. Provide path to a valid .png file.\n`
      );
      program.help();
    }

    // check if `imagePath` is a readable .png file
    if (path.extname(imagePath) !== '.png') {
      console.log(
        chalk.red(
          `\nProvided ${chalk.yellow(
            imagePathString
          )} file is not a .png file. Provide path to a valid .png file.\n`
        )
      );
      program.help();
    }
  }

  const backgroundColor = colorString.get(configuration.backgroundColor);
  if (!backgroundColor) {
    console.log(
      chalk.red(
        `\nProvided invalid argument ${chalk.yellow(
          configuration.backgroundColor
        )} as backgroundColor. See below for available formats for this argument.\n`
      )
    );
    program.help();
  }

  return {
    ...configuration,
    backgroundColor: colorString.to.hex(backgroundColor.value),
  };
}

async function runAsync() {
  program
    .arguments('<backgroundColor> [imagePath]')
    .description(
      'Idempotent operation that configures native splash screens using passed .png file that would be used in native splash screen.',
      {
        backgroundColor: `(${chalk.dim.red(
          'required'
        )}) Valid css-formatted color (hex (#RRGGBB[AA]), rgb[a], hsl[a], named color (https://drafts.csswg.org/css-color/#named-colors)) that would be used as background color for native splash screen view.`,
        imagePath: `(${chalk.dim.yellow('optional')}) Path to a valid .png image.`,
      }
    )
    .allowUnknownOption(false)
    .option(
      '-r, --resize-mode [resizeMode]',
      `ResizeMode to be used for native splash screen image. Available values: ${getAvailableOptions(
        ResizeMode
      )} (${chalk.yellow.dim(`only available for ${chalk.cyan.dim('android')} platform)`)}).`,
      (userInput: string) => {
        if (!Object.values<string>(ResizeMode).includes(userInput)) {
          console.log(
            chalk.red(
              `\nUnknown value ${chalk.yellow(userInput)} for option ${chalk.magenta(
                'resizeMode'
              )}. See below for the available values for this option.\n`
            )
          );
          program.help();
        }
        return userInput;
      },
      ResizeMode.CONTAIN
    )
    .option(
      '-p, --platform [platform]',
      `Selected platform to configure. Available values: ${getAvailableOptions(Platform)}.`,
      (userInput: string) => {
        if (!Object.values<string>(Platform).includes(userInput)) {
          console.log(
            chalk.red(
              `\nUnknown value ${chalk.yellow(userInput)} for option ${chalk.magenta(
                'platform'
              )}. See below for the available values for this option.\n`
            )
          );
          program.help();
        }
        return userInput;
      },
      Platform.ALL
    )
    .asyncAction(
      async (
        backgroundColor: string,
        imagePath: string | undefined,
        { resizeMode, platform }: program.Command & Options
      ) => {
        const configuration = { imagePath, backgroundColor, resizeMode, platform };
        const validatedConfiguration = await validateConfiguration(configuration);
        await action(validatedConfiguration);
      }
    );

  program.parse(process.argv);

  // With no argument passed command should prompt user about wrong usage
  if (program.args.length === 0) {
    console.log(
      chalk.red(
        `\nMissing argument ${chalk.yellow.dim(
          'backgroundColor'
        )}. See below for the required arguments.\n`
      )
    );
    program.help();
  }
}

async function run() {
  await runAsync().catch(e => {
    console.error(chalk.red('Uncaught error:'), chalk.red(e.message));
    process.exit(1);
  });
}

run();
