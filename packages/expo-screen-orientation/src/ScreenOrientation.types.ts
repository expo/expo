export enum Orientation {
  UNKNOWN = 0,
  PORTRAIT_UP = 1,
  PORTRAIT_DOWN = 2,
  LANDSCAPE_LEFT = 3,
  LANDSCAPE_RIGHT = 4,
}

export enum OrientationLock {
  DEFAULT = 0,
  ALL = 1,
  PORTRAIT = 2,
  PORTRAIT_UP = 3,
  PORTRAIT_DOWN = 4,
  LANDSCAPE = 5,
  LANDSCAPE_LEFT = 6,
  LANDSCAPE_RIGHT = 7,
  OTHER = 8,
  UNKNOWN = 9,
}

export enum SizeClassIOS {
  REGULAR = 0,
  COMPACT = 1,
  UNKNOWN = 2,
}

export enum WebOrientationLock {
  PORTRAIT_PRIMARY = 'portrait-primary',
  PORTRAIT_SECONDARY = 'portrait-secondary',
  PORTRAIT = 'portrait',
  LANDSCAPE_PRIMARY = 'landscape-primary',
  LANDSCAPE_SECONDARY = 'landscape-secondary',
  LANDSCAPE = 'landscape',
  ANY = 'any',
  NATURAL = 'natural',
  UNKNOWN = 'unknown',
}

export enum WebOrientation {
  PORTRAIT_PRIMARY = 'portrait-primary',
  PORTRAIT_SECONDARY = 'portrait-secondary',
  LANDSCAPE_PRIMARY = 'landscape-primary',
  LANDSCAPE_SECONDARY = 'landscape-secondary',
}

export type PlatformOrientationInfo = {
  screenOrientationConstantAndroid?: number;
  screenOrientationArrayIOS?: Orientation[];
  screenOrientationLockWeb?: WebOrientationLock;
};

export type ScreenOrientationInfo = {
  orientation: Orientation;
  verticalSizeClass?: SizeClassIOS;
  horizontalSizeClass?: SizeClassIOS;
};

export type OrientationChangeListener = (event: OrientationChangeEvent) => void;

export type OrientationChangeEvent = {
  orientationLock: OrientationLock;
  orientationInfo: ScreenOrientationInfo;
};
