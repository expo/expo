import { AndroidSplashConfig, Props } from './types';

export function getAndroidSplashConfig({
  android = {},
  resizeMode = 'contain',
  ...rest
}: Props): AndroidSplashConfig {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  const { dark, ...root } = {
    ...rest,
    ...android,
    resizeMode: android.resizeMode ?? resizeMode,
    dark: { ...rest.dark, ...android.dark },
  };

  return {
    imageWidth: root.imageWidth ?? 100,
    resizeMode: root.resizeMode,

    backgroundColor: root.backgroundColor ?? '#ffffff',

    image: root.image,
    mdpi: root.mdpi ?? root.image,
    hdpi: root.hdpi ?? root.image,
    xhdpi: root.xhdpi ?? root.image,
    xxhdpi: root.xxhdpi ?? root.image,
    xxxhdpi: root.xxxhdpi ?? root.image,

    dark: {
      backgroundColor: dark.backgroundColor,

      image: dark.image,
      mdpi: dark.mdpi ?? dark.image,
      hdpi: dark.hdpi ?? dark.image,
      xhdpi: dark.xhdpi ?? dark.image,
      xxhdpi: dark.xxhdpi ?? dark.image,
      xxxhdpi: dark.xxxhdpi ?? dark.image,
    },
  };
}
