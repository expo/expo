export enum Orientation {
  UNKNOWN = 'UNKNOWN',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
}

export enum OrientationLock {
  DEFAULT = 'DEFAULT',
  ALL = 'ALL',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
  ALL_BUT_UPSIDE_DOWN = 'ALL_BUT_UPSIDE_DOWN', // deprecated
}

export enum SizeClassIOS {
  REGULAR = 'REGULAR',
  COMPACT = 'COMPACT',
  UNKNOWN = 'UNKNOWN',
}

export type OrientationInfo = {
  orientation: Orientation;
  verticalSizeClass?: SizeClassIOS;
  horizontalSizeClass?: SizeClassIOS;
};

export type PlatformOrientationInfo = {
  screenOrientationConstantAndroid?: number;
  screenOrientationArrayIOS?: Orientation[];
  screenOrientationArrayWeb?: Orientation[];
};

export type OrientationChangeListener = (event: OrientationChangeEvent) => void;

export type OrientationChangeEvent = {
  orientationLock: OrientationLock;
  orientationInfo: OrientationInfo;
};
