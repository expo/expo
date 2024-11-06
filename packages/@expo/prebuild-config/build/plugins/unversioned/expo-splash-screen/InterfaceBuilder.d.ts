export type IBBoolean = 'YES' | 'NO' | boolean;
export type IBItem<H extends Record<string, any>, B extends Record<string, any[]> = {
    [key: string]: any;
}> = {
    $: H;
} & B;
export type Rect = {
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
};
export type IBRect = IBItem<Rect>;
export type IBAutoresizingMask = IBItem<{
    /** @example `autoresizingMask` */
    key: string;
    flexibleMaxX: IBBoolean;
    flexibleMaxY: IBBoolean;
}>;
/** @example `<color key="textColor" systemColor="linkColor"/>` */
export type IBColor = IBItem<{
    /** @example `textColor` */
    key: string;
} & (/** Custom color */ {
    /** @example `0.86584504117670746` */
    red: number;
    /** @example `0.26445041990630447` */
    green: number;
    /** @example `0.3248577810203549` */
    blue: number;
    /** @example `1` */
    alpha: number;
    colorSpace: 'custom' | string;
    customColorSpace: 'displayP3' | 'sRGB' | string;
}
/** Built-in color */
 | {
    systemColor: 'linkColor' | string;
})>;
export type IBFontDescription = IBItem<{
    /** @example `fontDescription` */
    key: string;
    /** Font size */
    pointSize: number;
    /** Custom font */
    name?: 'HelveticaNeue' | string;
    family?: 'Helvetica Neue' | string;
    /** Built-in font */
    type?: 'system' | 'boldSystem' | 'UICTFontTextStyleCallout' | 'UICTFontTextStyleBody' | string;
}>;
export type ImageContentMode = 'scaleAspectFit' | 'scaleAspectFill';
export type ConstraintAttribute = 'top' | 'bottom' | 'trailing' | 'leading' | 'centerX' | 'centerY';
export type IBImageView = IBItem<{
    id: string;
    userLabel: string;
    image: string;
    clipsSubviews?: IBBoolean;
    userInteractionEnabled: IBBoolean;
    contentMode: IBContentMode;
    horizontalHuggingPriority?: number;
    verticalHuggingPriority?: number;
    insetsLayoutMarginsFromSafeArea?: IBBoolean;
    translatesAutoresizingMaskIntoConstraints?: IBBoolean;
}, {
    rect: IBRect[];
}>;
export type IBLabel = IBItem<{
    id: string;
    /** The main value. */
    text: string;
    opaque: IBBoolean;
    fixedFrame: IBBoolean;
    textAlignment?: IBTextAlignment;
    lineBreakMode: 'clip' | 'characterWrap' | 'wordWrap' | 'headTruncation' | 'middleTruncation' | 'tailTruncation';
    baselineAdjustment?: 'none' | 'alignBaselines';
    adjustsFontSizeToFit: IBBoolean;
    userInteractionEnabled: IBBoolean;
    contentMode: IBContentMode;
    horizontalHuggingPriority: number;
    verticalHuggingPriority: number;
    translatesAutoresizingMaskIntoConstraints?: IBBoolean;
}, {
    /** @example `<rect key="frame" x="175" y="670" width="35" height="17"/>` */
    rect: IBRect[];
    /** @example `<autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>` */
    autoresizingMask?: IBAutoresizingMask[];
    /** @example `<fontDescription key="fontDescription" type="system" pointSize="19"/>` */
    fontDescription?: IBFontDescription[];
    /** @example `<color key="textColor" red="0.0" green="0.0" blue="0.0" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>` */
    color?: IBColor[];
    nil?: IBItem<{
        /** @example `textColor` `highlightedColor` */
        key: string;
    }>[];
}>;
export type IBTextAlignment = 'left' | 'center' | 'right' | 'justified' | 'natural';
export type IBContentMode = string | 'left' | 'scaleAspectFill';
export type IBConstraint = IBItem<{
    firstItem: string;
    firstAttribute: ConstraintAttribute;
    secondItem: string;
    secondAttribute: ConstraintAttribute;
    constant?: number;
    id: string;
}>;
export type IBViewController = IBItem<{
    id: string;
    placeholderIdentifier?: string;
    userLabel: string;
    sceneMemberID: string;
}, {
    view: IBItem<{
        id: string;
        key: string;
        userInteractionEnabled: IBBoolean;
        contentMode: string | 'scaleToFill';
        insetsLayoutMarginsFromSafeArea: IBBoolean;
        userLabel: string;
    }, {
        rect: IBRect[];
        autoresizingMask: IBItem<{
            key: string;
            flexibleMaxX: IBBoolean;
            flexibleMaxY: IBBoolean;
        }>[];
        subviews: IBItem<object, {
            imageView: IBImageView[];
            label: IBLabel[];
        }>[];
        color: IBItem<{
            key: string | 'backgroundColor';
            name?: string;
            systemColor?: string | 'systemBackgroundColor';
            red?: string;
            green?: string;
            blue?: string;
            alpha?: string;
            colorSpace?: string;
            customColorSpace?: string;
        }>[];
        constraints: IBItem<object, {
            constraint: IBConstraint[];
        }>[];
        viewLayoutGuide: IBItem<{
            id: string;
            key: string | 'safeArea';
        }>[];
    }>[];
}>;
export type IBPoint = IBItem<{
    key: string | 'canvasLocation';
    x: number;
    y: number;
}>;
export type IBScene = IBItem<{
    sceneID: string;
}, {
    objects: {
        viewController: IBViewController[];
        placeholder: IBItem<{
            id: string;
            placeholderIdentifier?: string;
            userLabel: string;
            sceneMemberID: string;
        }>[];
    }[];
    point: IBPoint[];
}>;
export type IBResourceImage = IBItem<{
    name: string;
    width: number;
    height: number;
}>;
export type IBResourceNamedColor = IBItem<{
    name?: string;
    systemColor?: string | 'systemBackgroundColor';
    red?: string;
    green?: string;
    blue?: string;
    alpha?: string;
    colorSpace?: string;
    customColorSpace?: string;
}>;
export type IBDevice = IBItem<{
    id: string;
    orientation: string | 'portrait';
    appearance: string | 'light';
}>;
export type IBSplashScreenDocument = {
    document: IBItem<{
        type: 'com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB' | string;
        version: '3.0' | string;
        toolsVersion: number;
        targetRuntime: 'iOS.CocoaTouch' | string;
        propertyAccessControl: 'none' | string;
        useAutolayout: IBBoolean;
        launchScreen: IBBoolean;
        useTraitCollections: IBBoolean;
        useSafeAreas: IBBoolean;
        colorMatched: IBBoolean;
        initialViewController: string;
    }, {
        device: IBDevice[];
        dependencies: unknown[];
        scenes: {
            scene: IBScene[];
        }[];
        resources: {
            image: IBResourceImage[];
            namedColor?: IBItem<{
                name: string;
            }, {
                color: IBResourceNamedColor[];
            }>[];
        }[];
    }>;
};
export declare function createConstraint([firstItem, firstAttribute]: [string, ConstraintAttribute], [secondItem, secondAttribute]: [string, ConstraintAttribute], constant?: number): IBConstraint;
export declare function createConstraintId(...attributes: string[]): string;
export declare function removeImageFromSplashScreen(xml: IBSplashScreenDocument, { imageName }: {
    imageName: string;
}): IBSplashScreenDocument;
export declare function applyImageToSplashScreenXML(xml: IBSplashScreenDocument, { imageName, contentMode, backgroundColor, enableFullScreenImage, imageWidth, }: {
    imageName: string;
    contentMode: ImageContentMode;
    backgroundColor: string;
    enableFullScreenImage: boolean;
    imageWidth?: number;
}): IBSplashScreenDocument;
/**
 * IB does not allow two items to have the same ID.
 * This method will add an item by first removing any existing item with the same `$.id`.
 */
export declare function ensureUniquePush<TItem extends {
    $: {
        id: string;
    };
}>(array: TItem[], item: TItem): TItem[];
export declare function removeExisting<TItem extends {
    $: {
        id: string;
    };
}>(array: TItem[], item: TItem | string): TItem[];
export declare function toString(xml: any): string;
/** Parse string contents into an object. */
export declare function toObjectAsync(contents: string): Promise<any>;
export declare const parseColor: (value: string) => Color;
type Color = {
    hex: string;
    rgb: {
        red: string;
        green: string;
        blue: string;
    };
};
export {};
