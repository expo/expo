"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseColor = void 0;
exports.createConstraint = createConstraint;
exports.createConstraintId = createConstraintId;
exports.removeImageFromSplashScreen = removeImageFromSplashScreen;
exports.applyImageToSplashScreenXML = applyImageToSplashScreenXML;
exports.ensureUniquePush = ensureUniquePush;
exports.removeExisting = removeExisting;
exports.toString = toString;
exports.toObjectAsync = toObjectAsync;
const crypto_1 = __importDefault(require("crypto"));
const xml2js_1 = require("xml2js");
function createConstraint([firstItem, firstAttribute], [secondItem, secondAttribute], constant) {
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
function createConstraintId(...attributes) {
    return crypto_1.default.createHash('sha1').update(attributes.join('-')).digest('hex');
}
const IMAGE_ID = 'EXPO-SplashScreen';
const CONTAINER_ID = 'EXPO-ContainerView';
function removeImageFromSplashScreen(xml, { imageName }) {
    const mainView = xml.document.scenes[0]?.scene[0]?.objects[0]?.viewController[0]?.view[0];
    if (mainView != null) {
        if (mainView.subviews[0] != null) {
            removeExisting(mainView.subviews[0].imageView, IMAGE_ID);
        }
        // Remove Constraints
        getAbsoluteConstraints(IMAGE_ID, CONTAINER_ID).forEach((constraint) => {
            // <constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="2VS-Uz-0LU"/>
            if (mainView.constraints[0] != null) {
                removeExisting(mainView.constraints[0].constraint, constraint);
            }
        });
    }
    // Remove resource
    if (xml.document.resources[0] != null) {
        xml.document.resources[0].image = xml.document.resources[0].image ?? [];
        const imageSection = xml.document.resources[0].image;
        const existingImageIndex = imageSection.findIndex((image) => image.$.name === imageName);
        if (existingImageIndex && existingImageIndex > -1) {
            imageSection?.splice(existingImageIndex, 1);
        }
    }
    return xml;
}
function getAbsoluteConstraints(childId, parentId, legacy = false) {
    if (legacy) {
        return [
            createConstraint([childId, 'top'], [parentId, 'top']),
            createConstraint([childId, 'leading'], [parentId, 'leading']),
            createConstraint([childId, 'trailing'], [parentId, 'trailing']),
            createConstraint([childId, 'bottom'], [parentId, 'bottom']),
        ];
    }
    return [
        createConstraint([childId, 'centerX'], [parentId, 'centerX']),
        createConstraint([childId, 'centerY'], [parentId, 'centerY']),
    ];
}
function applyImageToSplashScreenXML(xml, { imageName, contentMode, backgroundColor = '#ffffff', enableFullScreenImage, imageWidth = 100, }) {
    const mainView = xml.document.scenes[0]?.scene[0]?.objects[0]?.viewController[0]?.view[0];
    const rect = mainView?.rect[0];
    const width = enableFullScreenImage ? 414 : imageWidth;
    const height = enableFullScreenImage ? 736 : imageWidth;
    const x = enableFullScreenImage || rect == null ? 0 : (rect.$.width - width) / 2;
    const y = enableFullScreenImage || rect == null ? 0 : (rect.$.height - height) / 2;
    const imageView = {
        $: {
            id: IMAGE_ID,
            userLabel: imageName,
            image: imageName,
            contentMode,
            clipsSubviews: true,
            userInteractionEnabled: false,
            translatesAutoresizingMaskIntoConstraints: false,
        },
        rect: [
            {
                $: {
                    key: 'frame',
                    x,
                    y,
                    width,
                    height,
                },
            },
        ],
    };
    if (mainView != null) {
        // Add ImageView
        if (mainView.subviews[0] != null) {
            ensureUniquePush(mainView.subviews[0].imageView, imageView);
        }
        if (mainView.constraints[0] != null) {
            mainView.constraints[0].constraint = [];
        }
        // Add Constraints
        getAbsoluteConstraints(IMAGE_ID, CONTAINER_ID, enableFullScreenImage).forEach((constraint) => {
            if (mainView.constraints[0] != null) {
                ensureUniquePush(mainView.constraints[0].constraint, constraint);
            }
        });
        // Clear existing color
        mainView.color = [];
        // Add background color
        const colorSection = mainView.color;
        colorSection.push({
            $: {
                key: 'backgroundColor',
                name: 'SplashScreenBackground',
            },
        });
    }
    if (xml.document.resources[0] != null) {
        // Clear existing images
        xml.document.resources[0].image = [];
        // Add resource
        const imageSection = xml.document.resources[0].image;
        imageSection.push({
            $: {
                name: imageName,
                width,
                height,
            },
        });
        // Clear existing named colors
        xml.document.resources[0].namedColor = [];
        const namedColorSection = xml.document.resources[0].namedColor;
        // Add background named color reference
        const color = (0, exports.parseColor)(backgroundColor);
        namedColorSection.push({
            $: {
                name: 'SplashScreenBackground',
            },
            color: [
                {
                    $: {
                        alpha: '1.000',
                        blue: color.rgb.blue,
                        green: color.rgb.green,
                        red: color.rgb.red,
                        customColorSpace: 'sRGB',
                        colorSpace: 'custom',
                    },
                },
            ],
        });
    }
    return xml;
}
/**
 * IB does not allow two items to have the same ID.
 * This method will add an item by first removing any existing item with the same `$.id`.
 */
function ensureUniquePush(array, item) {
    if (!array)
        return array;
    removeExisting(array, item);
    array.push(item);
    return array;
}
function removeExisting(array, item) {
    const id = typeof item === 'string' ? item : item.$?.id;
    const existingItem = array?.findIndex((existingItem) => existingItem.$.id === id);
    if (existingItem > -1) {
        array.splice(existingItem, 1);
    }
    return array;
}
// Attempt to copy Xcode formatting.
function toString(xml) {
    const builder = new xml2js_1.Builder({
        // @ts-expect-error: untyped
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
function toObjectAsync(contents) {
    return new xml2js_1.Parser().parseStringPromise(contents);
}
// Function taken from react-native-bootsplash
const parseColor = (value) => {
    const color = value.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (color.length !== 3 && color.length !== 6) {
        console.error(`"${value}" value is not a valid hexadecimal color.`);
        process.exit(1);
    }
    const hex = color.length === 3
        ? '#' + color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
        : '#' + color;
    const rgb = {
        red: (parseInt('' + hex[1] + hex[2], 16) / 255).toPrecision(15),
        green: (parseInt('' + hex[3] + hex[4], 16) / 255).toPrecision(15),
        blue: (parseInt('' + hex[5] + hex[6], 16) / 255).toPrecision(15),
    };
    return { hex, rgb };
};
exports.parseColor = parseColor;
