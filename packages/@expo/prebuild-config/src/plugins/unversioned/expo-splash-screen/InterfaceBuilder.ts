import crypto from 'crypto';
import { Builder, Parser } from 'xml2js';

const debug = require('debug')(
  'expo:prebuild-config:expo-splash-screen:ios:InterfaceBuilder'
) as typeof console.log;

export type IBBoolean = 'YES' | 'NO' | boolean;

export type IBItem<
  H extends Record<string, any>,
  B extends Record<string, any[]> = { [key: string]: any }
> = {
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
export type IBColor = IBItem<
  {
    /** @example `textColor` */
    key: string;
  } & (
    | /** Custom color */
    {
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
      }
  )
>;

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

export type ConstraintAttribute = 'top' | 'bottom' | 'trailing' | 'leading';

export type IBImageView = IBItem<
  {
    id: string;
    userLabel: string;
    image: string;
    clipsSubviews?: IBBoolean;
    userInteractionEnabled: IBBoolean;
    contentMode: IBContentMode;
    horizontalHuggingPriority: number;
    verticalHuggingPriority: number;
    insetsLayoutMarginsFromSafeArea?: IBBoolean;
    translatesAutoresizingMaskIntoConstraints?: IBBoolean;
  },
  {
    rect: IBRect[];
  }
>;

export type IBLabel = IBItem<
  {
    id: string;
    /** The main value. */
    text: string;

    opaque: IBBoolean;
    fixedFrame: IBBoolean;
    textAlignment?: IBTextAlignment;
    lineBreakMode:
      | 'clip'
      | 'characterWrap'
      | 'wordWrap'
      | 'headTruncation'
      | 'middleTruncation'
      | 'tailTruncation';
    baselineAdjustment?: 'none' | 'alignBaselines';
    adjustsFontSizeToFit: IBBoolean;
    userInteractionEnabled: IBBoolean;
    contentMode: IBContentMode;
    horizontalHuggingPriority: number;
    verticalHuggingPriority: number;
    translatesAutoresizingMaskIntoConstraints?: IBBoolean;
  },
  {
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
  }
>;

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

export type IBViewController = IBItem<
  {
    id: string;
    placeholderIdentifier?: string;
    userLabel: string;
    sceneMemberID: string;
  },
  {
    view: IBItem<
      {
        id: string;
        key: string;
        userInteractionEnabled: IBBoolean;
        contentMode: string | 'scaleToFill';
        insetsLayoutMarginsFromSafeArea: IBBoolean;
        userLabel: string;
      },
      {
        rect: IBRect[];
        autoresizingMask: IBItem<{
          key: string;
          flexibleMaxX: IBBoolean;
          flexibleMaxY: IBBoolean;
        }>[];

        subviews: IBItem<
          object,
          {
            imageView: IBImageView[];
            label: IBLabel[];
          }
        >[];
        color: IBItem<{
          key: string | 'backgroundColor';
          systemColor: string | 'systemBackgroundColor';
        }>[];
        constraints: IBItem<
          object,
          {
            constraint: IBConstraint[];
          }
        >[];
        viewLayoutGuide: IBItem<{
          id: string;
          key: string | 'safeArea';
        }>[];
      }
    >[];
  }
>;

export type IBPoint = IBItem<{
  key: string | 'canvasLocation';
  x: number;
  y: number;
}>;

export type IBScene = IBItem<
  { sceneID: string },
  {
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
  }
>;

export type IBResourceImage = IBItem<{
  name: string;
  width: number;
  height: number;
}>;

export type IBDevice = IBItem<{
  id: string;
  orientation: string | 'portrait';
  appearance: string | 'light';
}>;

export type IBSplashScreenDocument = {
  document: IBItem<
    {
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
    },
    {
      device: IBDevice[];
      dependencies: unknown[];
      scenes: {
        scene: IBScene[];
      }[];
      resources: {
        image: IBResourceImage[];
      }[];
    }
  >;
};

export function createConstraint(
  [firstItem, firstAttribute]: [string, ConstraintAttribute],
  [secondItem, secondAttribute]: [string, ConstraintAttribute],
  constant?: number
): IBConstraint {
  return {
    $: {
      firstItem,
      firstAttribute,
      secondItem,
      secondAttribute,
      constant,
      // Prevent updating between runs
      id: createConstraintId(firstItem, firstAttribute, secondItem, secondAttribute),
    },
  };
}

export function createConstraintId(...attributes: string[]) {
  return crypto.createHash('sha1').update(attributes.join('-')).digest('hex');
}

const IMAGE_ID = 'EXPO-SplashScreen';
const CONTAINER_ID = 'EXPO-ContainerView';

export function removeImageFromSplashScreen(
  xml: IBSplashScreenDocument,
  { imageName }: { imageName: string }
) {
  const mainView = xml.document.scenes[0].scene[0].objects[0].viewController[0].view[0];

  debug(`Remove all splash screen image elements`);

  removeExisting(mainView.subviews[0].imageView, IMAGE_ID);

  // Add Constraints
  getAbsoluteConstraints(IMAGE_ID, CONTAINER_ID).forEach(constraint => {
    // <constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="2VS-Uz-0LU"/>
    const constrainsArray = mainView.constraints[0].constraint;
    removeExisting(constrainsArray, constraint);
  });

  // Add resource
  const imageSection = xml.document.resources[0].image;

  const existingImageIndex = imageSection.findIndex(image => image.$.name === imageName);
  if (existingImageIndex > -1) {
    imageSection.splice(existingImageIndex, 1);
  }
  return xml;
}

function getAbsoluteConstraints(childId: string, parentId: string) {
  return [
    createConstraint([childId, 'top'], [parentId, 'top']),
    createConstraint([childId, 'leading'], [parentId, 'leading']),
    createConstraint([childId, 'trailing'], [parentId, 'trailing']),
    createConstraint([childId, 'bottom'], [parentId, 'bottom']),
  ];
}

export function applyImageToSplashScreenXML(
  xml: IBSplashScreenDocument,
  {
    imageName,
    contentMode,
  }: {
    imageName: string;
    contentMode: ImageContentMode;
  }
): IBSplashScreenDocument {
  const width = 414;
  const height = 736;

  const imageView: IBImageView = {
    $: {
      id: IMAGE_ID,
      userLabel: imageName,
      image: imageName,
      contentMode,
      horizontalHuggingPriority: 251,
      verticalHuggingPriority: 251,
      clipsSubviews: true,
      userInteractionEnabled: false,
      translatesAutoresizingMaskIntoConstraints: false,
    },
    rect: [
      {
        $: {
          key: 'frame',
          x: 0.0,
          y: 0.0,
          width,
          height,
        },
      },
    ],
  };

  const mainView = xml.document.scenes[0].scene[0].objects[0].viewController[0].view[0];

  // Add ImageView
  ensureUniquePush(mainView.subviews[0].imageView, imageView);

  // Add Constraints
  getAbsoluteConstraints(IMAGE_ID, CONTAINER_ID).forEach(constraint => {
    // <constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="2VS-Uz-0LU"/>
    const constrainsArray = mainView.constraints[0].constraint;
    ensureUniquePush(constrainsArray, constraint);
  });

  // Add resource
  const imageSection = xml.document.resources[0].image;

  const existingImageIndex = imageSection.findIndex(image => image.$.name === imageName);
  if (existingImageIndex > -1) {
    debug(`Removing existing IB image asset at index ${existingImageIndex}`);
    imageSection.splice(existingImageIndex, 1);
  }
  imageSection.push({
    // <image name="SplashScreen" width="414" height="736"/>
    $: {
      name: imageName,
      width,
      height,
    },
  });

  return xml;
}

/**
 * IB does not allow two items to have the same ID.
 * This method will add an item by first removing any existing item with the same `$.id`.
 */
export function ensureUniquePush<TItem extends { $: { id: string } }>(array: TItem[], item: TItem) {
  if (!array) return array;
  removeExisting(array, item);
  array.push(item);
  return array;
}

export function removeExisting<TItem extends { $: { id: string } }>(
  array: TItem[],
  item: TItem | string
) {
  const id = typeof item === 'string' ? item : item.$?.id;
  const existingItem = array?.findIndex(existingItem => existingItem.$.id === id);
  if (existingItem > -1) {
    debug(`Removing existing IB item with id ${id}, from: %O`, array);
    array.splice(existingItem, 1);
  }
  return array;
}

// Attempt to copy Xcode formatting.
export function toString(xml: any): string {
  const builder = new Builder({
    preserveChildrenOrder: true,
    xmldec: {
      version: '1.0',
      encoding: 'UTF-8',
    },
    renderOpts: {
      pretty: true,
      indent: '    ',
    },
  });
  return builder.buildObject(xml);
}

/** Parse string contents into an object. */
export function toObjectAsync(contents: string) {
  return new Parser().parseStringPromise(contents);
}
