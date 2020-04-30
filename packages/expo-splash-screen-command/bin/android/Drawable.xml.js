"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const xml_manipulation_1 = require("../xml-manipulation");
const DRAWABLE_XML_FILE_PATH = `./res/drawable/splashscreen.xml`;
function configureDrawable(xml, resizeMode) {
    const expected = {
        elements: [
            {
                idx: 0,
                comment: `\n  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand\n`,
            },
            {
                name: 'layer-list',
                attributes: {
                    'xmlns:android': 'http://schemas.android.com/apk/res/android',
                },
                elements: {
                    newValue: [
                        {
                            name: 'item',
                            attributes: {
                                'android:drawable': '@color/splashscreen_background',
                            },
                        },
                    ].concat(resizeMode !== constants_1.ResizeMode.NATIVE
                        ? []
                        : [
                            {
                                name: 'item',
                                elements: [
                                    {
                                        name: 'bitmap',
                                        attributes: {
                                            'android:gravity': 'center',
                                            'android:src': '@drawable/splashscreen_image',
                                        },
                                    },
                                ],
                            },
                        ]),
                },
            },
        ],
    };
    const result = xml_manipulation_1.mergeXmlElements(xml, expected);
    return result;
}
/**
 * @param androidMainPath Path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 * @param resizeMode
 */
async function configureDrawableXml(androidMainPath, resizeMode) {
    const filePath = path_1.default.resolve(androidMainPath, DRAWABLE_XML_FILE_PATH);
    const xmlContent = await xml_manipulation_1.readXmlFile(filePath);
    const configuredXmlContent = configureDrawable(xmlContent, resizeMode);
    await xml_manipulation_1.writeXmlFile(filePath, configuredXmlContent);
}
exports.default = configureDrawableXml;
//# sourceMappingURL=Drawable.xml.js.map