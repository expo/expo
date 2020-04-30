"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const xml_manipulation_1 = require("../xml-manipulation");
const ANDROID_MANIFEST_XML_FILE_PATH = './AndroidManifest.xml';
function configureAndroidManifest(xml) {
    const result = xml_manipulation_1.mergeXmlElements(xml, {
        elements: [
            {
                name: 'manifest',
                elements: [
                    {
                        name: 'application',
                        attributes: {
                            'android:name': '.MainApplication',
                        },
                        elements: [
                            {
                                name: 'activity',
                                attributes: {
                                    'android:name': '.MainActivity',
                                    'android:theme': {
                                        newValue: '@style/Theme.App.SplashScreen',
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    });
    return result;
}
/**
 * @param androidMainPath Path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 */
async function configureAndroidManifestXml(androidMainPath) {
    const filePath = path_1.default.resolve(androidMainPath, ANDROID_MANIFEST_XML_FILE_PATH);
    const xmlContent = await xml_manipulation_1.readXmlFile(filePath);
    const configuredXmlContent = configureAndroidManifest(xmlContent);
    await xml_manipulation_1.writeXmlFile(filePath, configuredXmlContent);
}
exports.default = configureAndroidManifestXml;
//# sourceMappingURL=AndroidManifest.xml.js.map