"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyImageToSplashScreenXML = applyImageToSplashScreenXML;
exports.createConstraint = createConstraint;
exports.createConstraintId = createConstraintId;
exports.ensureUniquePush = ensureUniquePush;
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('expo:prebuild-config:expo-splash-screen:ios:InterfaceBuilder');

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
  removeExisting(mainView.subviews[0].imageView, IMAGE_ID); // Add Constraints

  getAbsoluteConstraints(IMAGE_ID, CONTAINER_ID).forEach(constraint => {
    // <constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="2VS-Uz-0LU"/>
    const constrainsArray = mainView.constraints[0].constraint;
    removeExisting(constrainsArray, constraint);
  }); // Add resource

  const imageSection = xml.document.resources[0].image;
  const existingImageIndex = imageSection.findIndex(image => image.$.name === imageName);

  if (existingImageIndex > -1) {
    imageSection.splice(existingImageIndex, 1);
  }

  return xml;
}

function getAbsoluteConstraints(childId, parentId) {
  return [createConstraint([childId, 'top'], [parentId, 'top']), createConstraint([childId, 'leading'], [parentId, 'leading']), createConstraint([childId, 'trailing'], [parentId, 'trailing']), createConstraint([childId, 'bottom'], [parentId, 'bottom'])];
}

function applyImageToSplashScreenXML(xml, {
  imageName,
  contentMode
}) {
  const width = 414;
  const height = 736;
  const imageView = {
    $: {
      id: IMAGE_ID,
      userLabel: imageName,
      image: imageName,
      contentMode,
      horizontalHuggingPriority: 251,
      verticalHuggingPriority: 251,
      clipsSubviews: true,
      userInteractionEnabled: false,
      translatesAutoresizingMaskIntoConstraints: false
    },
    rect: [{
      $: {
        key: 'frame',
        x: 0.0,
        y: 0.0,
        width,
        height
      }
    }]
  };
  const mainView = xml.document.scenes[0].scene[0].objects[0].viewController[0].view[0]; // Add ImageView

  ensureUniquePush(mainView.subviews[0].imageView, imageView); // Add Constraints

  getAbsoluteConstraints(IMAGE_ID, CONTAINER_ID).forEach(constraint => {
    // <constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="2VS-Uz-0LU"/>
    const constrainsArray = mainView.constraints[0].constraint;
    ensureUniquePush(constrainsArray, constraint);
  }); // Add resource

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
      height
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
  var _item$$;

  const id = typeof item === 'string' ? item : (_item$$ = item.$) === null || _item$$ === void 0 ? void 0 : _item$$.id;
  const existingItem = array === null || array === void 0 ? void 0 : array.findIndex(existingItem => existingItem.$.id === id);

  if (existingItem > -1) {
    debug(`Removing existing IB item with id ${id}, from: %O`, array);
    array.splice(existingItem, 1);
  }

  return array;
} // Attempt to copy Xcode formatting.


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
//# sourceMappingURL=InterfaceBuilder.js.map