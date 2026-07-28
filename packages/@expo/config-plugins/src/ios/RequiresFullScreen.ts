import type { ExpoConfig } from '@expo/config-types';

import type { InfoPlist } from './IosConfig.types';
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
 * Require full screen being disabled requires all ipad interfaces to be added,
 * otherwise submissions to the iOS App Store will fail.
 *
 * ERROR ITMS-90474: "Invalid Bundle. iPad Multitasking support requires these orientations: 'UIInterfaceOrientationPortrait,UIInterfaceOrientationPortraitUpsideDown,UIInterfaceOrientationLandscapeLeft,UIInterfaceOrientationLandscapeRight'. Found 'UIInterfaceOrientationPortrait,UIInterfaceOrientationPortraitUpsideDown' in bundle 'com.bacon.app'."
 *
 * As of iOS 27, `UIRequiresFullScreen` no longer opts an app out of resizing. It requests discrete
 * resizing that honors the supported interface orientations, it applies to iPhone as well as iPad,
 * and Apple has deprecated it.
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
      `iPad multitasking requires all \`${iPadInterfaceKey}\` orientations to be defined in the Info.plist, and the values currently defined are incompatible with it, so they will be overwritten to prevent a submission failure. Existing: ${existingList}. Note that as of iOS 27 supported orientations are a preference that resizable windows ignore, so define these for App Store validation rather than as a way to control layout.`
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
