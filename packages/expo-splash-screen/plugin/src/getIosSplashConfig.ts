const defaultResizeMode = 'contain';
const defaultBackgroundColor = '#ffffff';

export interface IOSSplashConfig {
  imageWidth?: number;
  image?: string;
  // tabletImage: string | null;
  backgroundColor?: string;
  enableFullScreenImage_legacy?: boolean;
  resizeMode: 'cover' | 'contain';
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
export function getIosSplashConfig(props: IOSSplashConfig): IOSSplashConfig {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except iOS.
  const splash = props;
  return {
    image: splash.image,
    resizeMode: splash.resizeMode ?? defaultResizeMode,
    backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
    tabletImage: splash.tabletImage,
    tabletBackgroundColor: splash.tabletBackgroundColor,
    enableFullScreenImage_legacy: splash.enableFullScreenImage_legacy,
    dark: {
      image: splash.dark?.image,
      backgroundColor: splash.dark?.backgroundColor,
      tabletImage: splash.dark?.tabletImage,
      tabletBackgroundColor: splash.dark?.tabletBackgroundColor,
    },
    imageWidth: splash.imageWidth,
  };
}
