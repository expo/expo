import * as AppleImpl from '../apple/Paths';

export const getAppDelegateHeaderFilePath = AppleImpl.getAppDelegateHeaderFilePath('ios');
export const getAppDelegateFilePath = AppleImpl.getAppDelegateFilePath('ios');
export const getAppDelegateObjcHeaderFilePath = AppleImpl.getAppDelegateObjcHeaderFilePath('ios');
export const getPodfilePath = AppleImpl.getPodfilePath('ios');
export const getAppDelegate = AppleImpl.getAppDelegate('ios');
export const getSourceRoot = AppleImpl.getSourceRoot('ios');
export const findSchemePaths = AppleImpl.findSchemePaths('ios');
export const findSchemeNames = AppleImpl.findSchemeNames('ios');
export const getAllXcodeProjectPaths = AppleImpl.getAllXcodeProjectPaths('ios');
export const getXcodeProjectPath = AppleImpl.getXcodeProjectPath('ios');
export const getAllPBXProjectPaths = AppleImpl.getAllPBXProjectPaths('ios');
export const getPBXProjectPath = AppleImpl.getPBXProjectPath('ios');
export const getAllInfoPlistPaths = AppleImpl.getAllInfoPlistPaths('ios');
export const getInfoPlistPath = AppleImpl.getInfoPlistPath('ios');
export const getAllEntitlementsPaths = AppleImpl.getAllEntitlementsPaths('ios');
export const getEntitlementsPath = AppleImpl.getEntitlementsPath('ios');
export const getSupportingPath = AppleImpl.getSupportingPath('ios');
export const getExpoPlistPath = AppleImpl.getExpoPlistPath('ios');

export type { PodfileProjectFile, AppDelegateProjectFile } from '../apple/Paths';
export { getFileInfo } from '../apple/Paths';