export declare enum Orientation {
    UNKNOWN = "UNKNOWN",
    PORTRAIT = "PORTRAIT",
    PORTRAIT_UP = "PORTRAIT_UP",
    PORTRAIT_DOWN = "PORTRAIT_DOWN",
    LANDSCAPE = "LANDSCAPE",
    LANDSCAPE_LEFT = "LANDSCAPE_LEFT",
    LANDSCAPE_RIGHT = "LANDSCAPE_RIGHT"
}
export declare enum OrientationLock {
    DEFAULT = "DEFAULT",
    ALL = "ALL",
    PORTRAIT = "PORTRAIT",
    PORTRAIT_UP = "PORTRAIT_UP",
    PORTRAIT_DOWN = "PORTRAIT_DOWN",
    LANDSCAPE = "LANDSCAPE",
    LANDSCAPE_LEFT = "LANDSCAPE_LEFT",
    LANDSCAPE_RIGHT = "LANDSCAPE_RIGHT",
    OTHER = "OTHER",
    UNKNOWN = "UNKNOWN",
    ALL_BUT_UPSIDE_DOWN = "ALL_BUT_UPSIDE_DOWN"
}
export declare enum SizeClassIOS {
    REGULAR = "REGULAR",
    COMPACT = "COMPACT",
    UNKNOWN = "UNKNOWN"
}
export declare enum WebOrientationLock {
    PORTRAIT_PRIMARY = "portrait-primary",
    PORTRAIT_SECONDARY = "portrait-secondary",
    PORTRAIT = "portrait",
    LANDSCAPE_PRIMARY = "landscape-primary",
    LANDSCAPE_SECONDARY = "landscape-secondary",
    LANDSCAPE = "landscape",
    ANY = "any",
    NATURAL = "natural",
    UNKNOWN = "unknown"
}
export declare enum WebOrientation {
    PORTRAIT_PRIMARY = "portrait-primary",
    PORTRAIT_SECONDARY = "portrait-secondary",
    LANDSCAPE_PRIMARY = "landscape-primary",
    LANDSCAPE_SECONDARY = "landscape-secondary"
}
export declare type OrientationInfo = {
    orientation: Orientation;
    verticalSizeClass?: SizeClassIOS;
    horizontalSizeClass?: SizeClassIOS;
};
export declare type PlatformOrientationInfo = {
    screenOrientationConstantAndroid?: number;
    screenOrientationArrayIOS?: Orientation[];
    screenOrientationLockWeb?: WebOrientationLock;
};
export declare type OrientationChangeListener = (event: OrientationChangeEvent) => void;
export declare type OrientationChangeEvent = {
    orientationLock: OrientationLock;
    orientationInfo: OrientationInfo;
};
