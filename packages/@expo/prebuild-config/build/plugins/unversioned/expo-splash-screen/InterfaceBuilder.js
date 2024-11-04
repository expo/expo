"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyImageToSplashScreenXML = applyImageToSplashScreenXML;
exports.createConstraint = createConstraint;
exports.createConstraintId = createConstraintId;
exports.ensureUniquePush = ensureUniquePush;
exports.parseColor = void 0;
exports.removeExisting = removeExisting;
exports.removeImageFromSplashScreen = removeImageFromSplashScreen;
exports.toObjectAsync = toObjectAsync;
exports.toString = toString;
function _crypto() {
  const data = _interopRequireDefault(require("crypto"));
  _crypto = function () {
    return data;
  };
  return data;
}
function _xml2js() {
  const data = require("xml2js");
  _xml2js = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = require('debug')('expo:prebuild-config:expo-splash-screen:ios:InterfaceBuilder');

/** @example `<color key="textColor" systemColor="linkColor"/>` */

function createConstraint([firstItem, firstAttribute], [secondItem, secondAttribute], constant) {
  return {
    $: {
      firstItem,
      firstAttribute,
      secondItem,
      secondAttribute,
      constant,
      // Prevent updating between runs
      id: createConstraintId(firstItem, firstAttribute, secondItem, secondAttribute)
    }
  };
}
function createConstraintId(...attributes) {
  return _crypto().default.createHash('sha1').update(attributes.join('-')).digest('hex');
}
const IMAGE_ID = 'EXPO-SplashScreen';
const CONTAINER_ID = 'EXPO-ContainerView';
function removeImageFromSplashScreen(xml, {
  imageName
}) {
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
function getAbsoluteConstraints(childId, parentId) {
  return [createConstraint([childId, 'centerX'], [parentId, 'centerX']), createConstraint([childId, 'centerY'], [parentId, 'centerY'])];
}
function applyImageToSplashScreenXML(xml, {
  imageName,
  contentMode,
  backgroundColor,
  logoWidth = 100
}) {
  const mainView = xml.document.scenes[0].scene[0].objects[0].viewController[0].view[0];
  const width = logoWidth;
  const height = logoWidth;
  const x = (mainView.rect[0].$.width - width) / 2;
  const y = (mainView.rect[0].$.height - height) / 2;
  const imageView = {
    $: {
      id: IMAGE_ID,
      userLabel: imageName,
      image: imageName,
      contentMode,
      clipsSubviews: true,
      userInteractionEnabled: false,
      translatesAutoresizingMaskIntoConstraints: false
    },
    rect: [{
      $: {
        key: 'frame',
        x,
        y,
        width,
        height
      }
    }]
  };

  // Add ImageView
  ensureUniquePush(mainView.subviews[0].imageView, imageView);
  mainView.constraints[0].constraint = [];

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
    $: {
      name: imageName,
      width,
      height
    }
  });

  // Add background color
  mainView.color = mainView.color ?? [];
  const colorSection = mainView.color;
  const color = parseColor(backgroundColor);
  colorSection.push({
    $: {
      key: 'backgroundColor',
      ...color.rgb,
      alpha: '1',
      colorSpace: 'custom',
      customColorSpace: 'sRGB'
    }
  });
  return xml;
}

/**
 * IB does not allow two items to have the same ID.
 * This method will add an item by first removing any existing item with the same `$.id`.
 */
function ensureUniquePush(array, item) {
  if (!array) return array;
  removeExisting(array, item);
  array.push(item);
  return array;
}
function removeExisting(array, item) {
  const id = typeof item === 'string' ? item : item.$?.id;
  const existingItem = array?.findIndex(existingItem => existingItem.$.id === id);
  if (existingItem > -1) {
    debug(`Removing existing IB item with id ${id}, from: %O`, array);
    array.splice(existingItem, 1);
  }
  return array;
}

// Attempt to copy Xcode formatting.
function toString(xml) {
  const builder = new (_xml2js().Builder)({
    // @ts-expect-error: untyped
    preserveChildrenOrder: true,
    xmldec: {
      version: '1.0',
      encoding: 'UTF-8'
    },
    renderOpts: {
      pretty: true,
      indent: '    '
    }
  });
  return builder.buildObject(xml);
}

/** Parse string contents into an object. */
function toObjectAsync(contents) {
  return new (_xml2js().Parser)().parseStringPromise(contents);
}

// Function taken from react-native-bootsplash
const parseColor = value => {
  const color = value.toUpperCase().replace(/[^0-9A-F]/g, '');
  if (color.length !== 3 && color.length !== 6) {
    console.error(`"${value}" value is not a valid hexadecimal color.`);
    process.exit(1);
  }
  const hex = color.length === 3 ? '#' + color[0] + color[0] + color[1] + color[1] + color[2] + color[2] : '#' + color;
  const rgb = {
    red: (parseInt('' + hex[1] + hex[2], 16) / 255).toPrecision(15),
    green: (parseInt('' + hex[3] + hex[4], 16) / 255).toPrecision(15),
    blue: (parseInt('' + hex[5] + hex[6], 16) / 255).toPrecision(15)
  };
  return {
    hex,
    rgb
  };
};
exports.parseColor = parseColor;
//# sourceMappingURL=InterfaceBuilder.js.map