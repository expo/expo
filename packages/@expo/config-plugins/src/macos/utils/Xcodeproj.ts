import * as AppleImpl from '../../apple/utils/Xcodeproj';

export const getProjectName = AppleImpl.getProjectName('macos');

// TODO: come up with a better solution for using app.json expo.name in various places
export const resolvePathOrProject = AppleImpl.resolvePathOrProject('macos');

// TODO: it's silly and kind of fragile that we look at app config to determine
// the macos/macos project paths. Overall this function needs to be revamped, just
// a placeholder for now! Make this more robust when we support applying config
// at any time (currently it's only applied on eject).
export const getHackyProjectName = AppleImpl.getHackyProjectName('macos');

/**
 * Add a resource file (ex: `SplashScreen.storyboard`, `Images.xcassets`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export const addResourceFileToGroup = AppleImpl.addResourceFileToGroup('macos');

/**
 * Add a build source file (ex: `AppDelegate.m`, `ViewController.swift`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export const addBuildSourceFileToGroup = AppleImpl.addBuildSourceFileToGroup('macos');

// TODO(brentvatne): I couldn't figure out how to do this with an existing
// higher level function exposed by the xcode library, but we should find out how to do
// that and replace this with it
export const addFileToGroupAndLink = AppleImpl.addFileToGroupAndLink('macos');

/**
 * Get the pbxproj for the given path
 */
export const getPbxproj = AppleImpl.getPbxproj('macos');

export type {
  ProjectSectionEntry,
  NativeTargetSection,
  NativeTargetSectionEntry,
  ConfigurationLists,
  ConfigurationListEntry,
  ConfigurationSectionEntry,
} from '../../apple/utils/Xcodeproj';

export {
  sanitizedName,
  getApplicationNativeTarget,
  addFramework,
  ensureGroupRecursively,
  getProductName,
  getProjectSection,
  getXCConfigurationListEntries,
  getBuildConfigurationsForListId,
  getBuildConfigurationForListIdAndName,
  isBuildConfig,
  isNotTestHost,
  isNotComment,
  unquote,
  resolveXcodeBuildSetting,
} from '../../apple/utils/Xcodeproj';
