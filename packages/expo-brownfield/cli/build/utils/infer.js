"use strict";
// import fs from 'node:fs/promises';
// import path from 'path';
Object.defineProperty(exports, "__esModule", { value: true });
// import { Errors } from '../constants';
// export const inferXCWorkspace = async (): Promise<string> => {
//   try {
//     const iosPath = path.join(process.cwd(), 'ios');
//     await fs.access(iosPath);
//     const xcworkspace = (await fs.readdir(iosPath, { withFileTypes: true })).find((item) =>
//       item.name.endsWith('.xcworkspace')
//     );
//     if (xcworkspace) {
//       return path.join(iosPath, xcworkspace.name);
//     }
//     throw new Error('Unable to find brownfield iOS Workspace (.xcworkspace)');
//   } catch (error) {
//     return Errors.inference('iOS Workspace (.xcworkspace)');
//   }
// };
// export const inferScheme = async (): Promise<string> => {
//   try {
//     const iosPath = path.join(process.cwd(), 'ios');
//     await fs.access(iosPath);
//     const subDirs = (await fs.readdir(iosPath, { withFileTypes: true })).filter((item) =>
//       item.isDirectory()
//     );
//     for (const subDir of subDirs) {
//       try {
//         const subDirPath = path.join(iosPath, subDir.name);
//         const contents = await fs.readdir(subDirPath);
//         if (contents.includes('ReactNativeHostManager.swift')) {
//           return subDir.name;
//         }
//       } catch (readError) {
//         continue;
//       }
//     }
//     throw new Error('Unable to find brownfield iOS group');
//   } catch (error) {
//     return Errors.inference('iOS Scheme');
//   }
// };
