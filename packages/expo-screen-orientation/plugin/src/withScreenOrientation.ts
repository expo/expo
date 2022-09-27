import assert from 'assert';
import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, createRunOncePlugin, InfoPlist, withInfoPlist } from 'expo/config-plugins';

const pkg = require('expo-screen-orientation/package.json');

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

const withScreenOrientationViewController: ConfigPlugin<
  {
    initialOrientation?: keyof typeof OrientationLock;
  } | void
> = (config, { initialOrientation = 'DEFAULT' } = {}) => {
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

export function getInitialOrientation(
  config: Pick<ExpoConfigWithInitialOrientation, 'initialOrientation'>
): OrientationMasks {
  return config.initialOrientation ?? 'DEFAULT';
}

export function setInitialOrientation(
  config: Pick<ExpoConfigWithInitialOrientation, 'initialOrientation'>,
  infoPlist: InfoPlist
): InfoPlist {
  const initialOrientation = getInitialOrientation(config);

  assert(
    initialOrientation in OrientationLock,
    `Invalid initial orientation "${initialOrientation}" expected one of: ${Object.keys(
      OrientationLock
    ).join(', ')}`
  );

  if (initialOrientation === 'DEFAULT') {
    delete infoPlist[INITIAL_ORIENTATION_KEY];
  } else {
    infoPlist[INITIAL_ORIENTATION_KEY] = OrientationLock[initialOrientation];
  }
  return infoPlist;
}

export default createRunOncePlugin(withScreenOrientationViewController, pkg.name, pkg.version);
