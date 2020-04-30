"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const xml_manipulation_1 = require("../xml-manipulation");
const STYLES_XML_FILE_PATH = './res/values/styles.xml';
function configureStyle(xml) {
    const result = xml_manipulation_1.mergeXmlElements(xml, {
        elements: [
            {
                name: 'resources',
                elements: [
                    {
                        name: 'style',
                        attributes: {
                            name: 'Theme.App.SplashScreen',
                            parent: 'Theme.AppCompat.Light.NoActionBar',
                        },
                        elements: [
                            {
                                idx: 0,
                                comment: ` Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually `,
                            },
                            {
                                idx: 1,
                                name: 'item',
                                attributes: {
                                    name: 'android:windowBackground',
                                },
                                elements: [
                                    {
                                        text: '@drawable/splashscreen',
                                    },
                                ],
                            },
                            {
                                comment: ` Customize your splash screen theme here `,
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
async function configureStylesXml(androidMainPath) {
    const filePath = path_1.default.resolve(androidMainPath, STYLES_XML_FILE_PATH);
    const xmlContent = await xml_manipulation_1.readXmlFile(filePath);
    const configuredXmlContent = configureStyle(xmlContent);
    await xml_manipulation_1.writeXmlFile(filePath, configuredXmlContent);
}
exports.default = configureStylesXml;
//# sourceMappingURL=Styles.xml.js.map