import { ExpoConfig } from '@expo/config-types';

import { InfoPlist } from './IosConfig.types';
import { createInfoPlistPlugin } from '../plugins/ios-plugins';
import { addWarningIOS } from '../utils/warnings';

export const withRequiresFullScreen = createInfoPlistPlugin(
  setRequiresFullScreen,
  'withRequiresFullScreen'
);

const iPadInterfaceKey = 'UISupportedInterfaceOrientations~ipad';

const requiredIPadInterface = [
  'UIInterfaceOrientationPortrait',
  'UIInterfaceOrientationPortraitUpsideDown',
  'UIInterfaceOrientationLandscapeLeft',
  'UIInterfaceOrientationLandscapeRight',
];

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((value) => typeof value === 'string');
}

function hasMinimumOrientations(masks: string[]): boolean {
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
function resolveExistingIpadInterfaceOrientations(interfaceOrientations: any): string[] {
  if (
    // Ensure type.
    isStringArray(interfaceOrientations) &&
    // Don't warn if it's an empty array, this is invalid regardless.
    interfaceOrientations.length &&
    // Check if the minimum requirements are met.
    !hasMinimumOrientations(interfaceOrientations)
  ) {
    const existingList = interfaceOrientations!.join(', ');
    addWarningIOS(
      'ios.requireFullScreen',
      `iPad multitasking requires all \`${iPadInterfaceKey}\` orientations to be defined in the Info.plist. The Info.plist currently defines values that are incompatible with multitasking, these will be overwritten to prevent submission failure. Existing: ${existingList}`
    );
    return interfaceOrientations;
  }
  return [];
}

// Whether requires full screen on iPad
export function setRequiresFullScreen(
  config: Pick<ExpoConfig, 'ios'>,
  infoPlist: InfoPlist
): InfoPlist {
  const requiresFullScreen = !!config.ios?.requireFullScreen;
  const isTabletEnabled = config.ios?.supportsTablet || config.ios?.isTabletOnly;
  if (isTabletEnabled && !requiresFullScreen) {
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
