import * as AppleImpl from '../apple/Paths';

export const getAppDelegateHeaderFilePath = AppleImpl.getAppDelegateHeaderFilePath('macos');
export const getAppDelegateFilePath = AppleImpl.getAppDelegateFilePath('macos');
export const getAppDelegateObjcHeaderFilePath = AppleImpl.getAppDelegateObjcHeaderFilePath('macos');
export const getPodfilePath = AppleImpl.getPodfilePath('macos');
export const getAppDelegate = AppleImpl.getAppDelegate('macos');
export const getSourceRoot = AppleImpl.getSourceRoot('macos');
export const findSchemePaths = AppleImpl.findSchemePaths('macos');
export const findSchemeNames = AppleImpl.findSchemeNames('macos');
export const getAllXcodeProjectPaths = AppleImpl.getAllXcodeProjectPaths('macos');
export const getXcodeProjectPath = AppleImpl.getXcodeProjectPath('macos');
export const getAllPBXProjectPaths = AppleImpl.getAllPBXProjectPaths('macos');
export const getPBXProjectPath = AppleImpl.getPBXProjectPath('macos');
export const getAllInfoPlistPaths = AppleImpl.getAllInfoPlistPaths('macos');
export const getInfoPlistPath = AppleImpl.getInfoPlistPath('macos');
export const getAllEntitlementsPaths = AppleImpl.getAllEntitlementsPaths('macos');
export const getEntitlementsPath = AppleImpl.getEntitlementsPath('macos');
export const getSupportingPath = AppleImpl.getSupportingPath('macos');
export const getExpoPlistPath = AppleImpl.getExpoPlistPath('macos');

export type { PodfileProjectFile, AppDelegateProjectFile } from '../apple/Paths';
export { getFileInfo } from '../apple/Paths';
