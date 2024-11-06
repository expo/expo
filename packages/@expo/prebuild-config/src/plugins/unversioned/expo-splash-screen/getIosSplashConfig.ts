import { ExpoConfig } from '@expo/config-types';

type ExpoConfigIosSplash = NonNullable<NonNullable<ExpoConfig['ios']>['splash']>;

const defaultResizeMode = 'contain';
const defaultBackgroundColor = '#ffffff';

export interface IOSSplashConfig {
  imageWidth?: number;
  image?: string;
  // tabletImage: string | null;
  backgroundColor: string;
  enableFullScreenImage_legacy?: boolean;
  resizeMode: NonNullable<ExpoConfigIosSplash['resizeMode']>;
  tabletImage?: string;
  // TODO: These are here just to test the functionality, the API should be more robust and account for tablet images.
  tabletBackgroundColor?: string;
  dark?: {
    image?: string;
    backgroundColor?: string;
    tabletImage?: string;
    tabletBackgroundColor?: string;
  };
}

// TODO: Maybe use an array on splash with theme value. Then remove the array in serialization for legacy and manifest.
export function getIosSplashConfig(
  config: ExpoConfig,
  props: IOSSplashConfig | null
): IOSSplashConfig | null {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except iOS.

  // We are using the config plugin
  if (props) {
    const splash = props;
    return {
      image: splash.image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
      tabletImage: splash.tabletImage,
      tabletBackgroundColor: splash.tabletBackgroundColor,
      dark: {
        image: splash.dark?.image,
        backgroundColor: splash.dark?.backgroundColor,
        tabletImage: splash.dark?.tabletImage,
        tabletBackgroundColor: splash.dark?.tabletBackgroundColor,
      },
      imageWidth: splash.imageWidth,
    };
  }

  if (config.ios?.splash) {
    const splash = config.ios?.splash;
    const image = splash.image;
    return {
      image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
      tabletImage: splash.tabletImage,
      tabletBackgroundColor: splash.tabletBackgroundColor,
      dark: {
        image: splash.dark?.image,
        backgroundColor: splash.dark?.backgroundColor,
        tabletImage: splash.dark?.tabletImage,
        tabletBackgroundColor: splash.dark?.tabletBackgroundColor,
      },
      imageWidth: 200,
    };
  }

  if (config.splash) {
    const splash = config.splash;
    const image = splash.image;
    return {
      image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
      imageWidth: 200,
    };
  }

  return {
    backgroundColor: '#ffffff',
    resizeMode: 'contain',
    imageWidth: 200,
  };
}
