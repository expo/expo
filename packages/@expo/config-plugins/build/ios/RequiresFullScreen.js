"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRequiresFullScreen = exports.getRequiresFullScreen = exports.withRequiresFullScreen = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
const versions_1 = require("../utils/versions");
const warnings_1 = require("../utils/warnings");
exports.withRequiresFullScreen = (0, ios_plugins_1.createInfoPlistPlugin)(setRequiresFullScreen, 'withRequiresFullScreen');
// NOTES: This is defaulted to `true` for now to match the behavior prior to SDK
// 34, but will change to `false` in SDK +43.
function getRequiresFullScreen(config) {
    // Yes, the property is called ios.requireFullScreen, without the s - not "requires"
    // This is confusing indeed because the actual property name does have the s
    if (config.ios?.hasOwnProperty('requireFullScreen')) {
        return !!config.ios.requireFullScreen;
    }
    else {
        // In SDK 43, the `requireFullScreen` default has been changed to false.
        if ((0, versions_1.gteSdkVersion)(config, '43.0.0')
        // TODO: Uncomment after SDK 43 is released.
        // || !config.sdkVersion
        ) {
            return false;
        }
        return true;
    }
}
exports.getRequiresFullScreen = getRequiresFullScreen;
const iPadInterfaceKey = 'UISupportedInterfaceOrientations~ipad';
const requiredIPadInterface = [
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationPortraitUpsideDown',
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
];
function isStringArray(value) {
    return Array.isArray(value) && value.every((value) => typeof value === 'string');
}
function hasMinimumOrientations(masks) {
    return requiredIPadInterface.every((mask) => masks.includes(mask));
}
/**
 * Require full screen being disabled requires all ipad interfaces to to be added,
 * otherwise submissions to the iOS App Store will fail.
 *
 * ERROR ITMS-90474: "Invalid Bundle. iPad Multitasking support requires these orientations: 'UIInterfaceOrientationPortrait,UIInterfaceOrientationPortraitUpsideDown,UIInterfaceOrientationLandscapeLeft,UIInterfaceOrientationLandscapeRight'. Found 'UIInterfaceOrientationPortrait,UIInterfaceOrientationPortraitUpsideDown' in bundle 'com.bacon.app'."
 *
 * @param interfaceOrientations
 * @returns
 */
function resolveExistingIpadInterfaceOrientations(interfaceOrientations) {
    if (
    // Ensure type.
    isStringArray(interfaceOrientations) &&
        // Don't warn if it's an empty array, this is invalid regardless.
        interfaceOrientations.length &&
        // Check if the minimum requirements are met.
        !hasMinimumOrientations(interfaceOrientations)) {
        const existingList = interfaceOrientations.join(', ');
        (0, warnings_1.addWarningIOS)('ios.requireFullScreen', `iPad multitasking requires all \`${iPadInterfaceKey}\` orientations to be defined in the Info.plist. The Info.plist currently defines values that are incompatible with multitasking, these will be overwritten to prevent submission failure. Existing: ${existingList}`);
        return interfaceOrientations;
    }
    return [];
}
// Whether requires full screen on iPad
function setRequiresFullScreen(config, infoPlist) {
    const requiresFullScreen = getRequiresFullScreen(config);
    if (!requiresFullScreen) {
        const existing = resolveExistingIpadInterfaceOrientations(infoPlist[iPadInterfaceKey]);
        // There currently exists no mechanism to safely undo this feature besides `npx expo prebuild --clear`,
        // this seems ok though because anyone using `UISupportedInterfaceOrientations~ipad` probably
        // wants them to be defined to this value anyways. This is also the default value used in the Xcode iOS template.
        // Merge any previous interfaces with the required interfaces.
        infoPlist[iPadInterfaceKey] = [...new Set(existing.concat(requiredIPadInterface))];
    }
    return {
        ...infoPlist,
        UIRequiresFullScreen: requiresFullScreen,
    };
}
exports.setRequiresFullScreen = setRequiresFullScreen;
