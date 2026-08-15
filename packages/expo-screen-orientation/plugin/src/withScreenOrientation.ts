import assert from 'assert';
import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, createRunOncePlugin, InfoPlist, withInfoPlist } from 'expo/config-plugins';

const pkg = require('../../package.json');

// This value must match the `EXDefaultScreenOrientationMask` string used in `expo-screen-orientation/ios/EXScreenOrientation/EXScreenOrientationViewController.m` (do not change).
export const INITIAL_ORIENTATION_KEY = 'EXDefaultScreenOrientationMask';

const OrientationLock = {
  DEFAULT: 'UIInterfaceOrientationMaskAllButUpsideDown',
  ALL: 'UIInterfaceOrientationMaskAll',
  PORTRAIT: 'UIInterfaceOrientationMaskPortrait',
  PORTRAIT_UP: 'UIInterfaceOrientationMaskPortrait',
  PORTRAIT_DOWN: 'UIInterfaceOrientationMaskPortraitUpsideDown',
  LANDSCAPE: 'UIInterfaceOrientationMaskLandscape',
  LANDSCAPE_LEFT: 'UIInterfaceOrientationMaskLandscapeLeft',
  LANDSCAPE_RIGHT: 'UIInterfaceOrientationMaskLandscapeRight',
};

type OrientationMasks = keyof typeof OrientationLock;

// `initialOrientation` is not public in expo config yet, we just use it as an internal type.
interface ExpoConfigWithInitialOrientation extends ExpoConfig {
  initialOrientation?: OrientationMasks;
}

export type Props = {
  /**
   * The iOS initial screen orientation. Accepts `DEFAULT`, `ALL`, `PORTRAIT`, `PORTRAIT_UP`, `PORTRAIT_DOWN`, `LANDSCAPE`, `LANDSCAPE_LEFT`, `LANDSCAPE_RIGHT`.
   * @platform ios
   */
  initialOrientation?: keyof typeof OrientationLock;
};

const withScreenOrientationViewController: ConfigPlugin<Props | void> = (
  config,
  { initialOrientation } = {}
) => {
  config = withInfoPlist(config, (config) => {
    const extendedConfig = {
      ...config,
      initialOrientation,
    };
    config.modResults = setInitialOrientation(extendedConfig, config.modResults);
    return config;
  });
  return config;
};

export function setInitialOrientation(
  config: Pick<ExpoConfigWithInitialOrientation, 'initialOrientation'>,
  infoPlist: InfoPlist
): InfoPlist {
  const initialOrientation = config.initialOrientation;

  if (!initialOrientation) {
    delete infoPlist[INITIAL_ORIENTATION_KEY];
    return infoPlist;
  }

  assert(
    initialOrientation in OrientationLock,
    `Invalid initial orientation "${initialOrientation}" expected one of: ${Object.keys(
      OrientationLock
    ).join(', ')}`
  );

  infoPlist[INITIAL_ORIENTATION_KEY] = OrientationLock[initialOrientation];

  return infoPlist;
}

export default createRunOncePlugin(withScreenOrientationViewController, pkg.name, pkg.version);
