"use strict";
// import fs from 'node:fs/promises';
// import path from 'node:path';
// import readline from 'node:readline/promises';
Object.defineProperty(exports, "__esModule", { value: true });
// import chalk from 'chalk';
// import { errorMessage, Loader, successMessage, warningSymbol } from './output';
// import type { BuildConfigCommon, BuildType } from './types';
// const hasPrebuildDirectory = async (
//   platform: 'ios' | 'android',
// ): Promise<boolean> => {
//   try {
//     await fs.access(platform);
//     return true;
//   } catch {
//     return false;
//   }
// };
// export const validatePrebuild = async (
//   platform: 'ios' | 'android',
// ): Promise<boolean> => {
//   if (!(await hasPrebuildDirectory(platform))) {
//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     let response = await rl.question(
//       `${chalk.yellow(warningSymbol)} Project seems to be missing prebuild for ${platform}. Do you want to prebuild now? [Y/n] `,
//     );
//     response = response.toLowerCase();
//     if (response === 'y' || response === 'yes') {
//       Loader.shared.start(`Prebuilding native project for ${platform}...`);
//       await runCommand(
//         'npx',
//         ['expo', 'prebuild', '--clean', '--platform', platform],
//         {
//           env: { EXPO_NO_GIT_STATUS: '1' },
//         },
//       );
//       Loader.shared.stop();
//       successMessage(`Native project for ${platform} prebuilt successfully`);
//       return true;
//     } else {
//       errorMessage(`Missing prebuild! Skipping building for ${platform}`);
//       return false;
//     }
//   }
//   return true;
// };
// export const getOptionValue = (options: string[], flags: string[]): string => {
//   const index = options.findLastIndex((option) => flags.includes(option));
//   if (index === -1) {
//     return '';
//   }
//   // --flag=value
//   if (options[index].includes('=')) {
//     return options[index].split('=')[1];
//   }
//   // --flag value
//   if (index + 1 >= options.length) {
//     errorMessage(`Option '${options[index]}' requires a value to be passed`);
//     process.exit(1);
//   }
//   return options[index + 1];
// };
// export const splitOptionList = (optionValue: string): string[] => {
//   if (!optionValue) {
//     return [];
//   }
//   return optionValue.split(',');
// };
// export const getCommonConfig = async (
//   options: string[],
// ): Promise<BuildConfigCommon> => {
//   let artifactsDir = getOptionValue(options, ['--artifacts', '-a']);
//   if (!artifactsDir) {
//     artifactsDir = './artifacts';
//   }
//   artifactsDir = path.isAbsolute(artifactsDir)
//     ? artifactsDir
//     : path.join(process.cwd(), artifactsDir);
//   let configuration: BuildType = 'Release';
//   if (options.includes('-d') || options.includes('--debug')) {
//     configuration = 'Debug';
//   }
//   // If both options are passed, release takes precedence
//   if (options.includes('-r') || options.includes('--release')) {
//     configuration = 'Release';
//   }
//   let verbose = false;
//   if (options.includes('--verbose')) {
//     verbose = true;
//   }
//   Loader.shared.setVerbose(verbose);
//   return {
//     artifactsDir,
//     configuration,
//     verbose,
//   };
// };
