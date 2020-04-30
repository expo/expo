"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const color_string_1 = __importDefault(require("color-string"));
const path_1 = __importDefault(require("path"));
const xml_manipulation_1 = require("../xml-manipulation");
const COLORS_XML_FILE_PATH = './res/values/colors.xml';
function configureBackgroundColor(xml, backgroundColor) {
    const result = xml_manipulation_1.mergeXmlElements(xml, {
        elements: [
            {
                name: 'resources',
                elements: [
                    {
                        idx: 0,
                        comment: ` Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually `,
                    },
                    {
                        idx: 1,
                        name: 'color',
                        attributes: {
                            name: 'splashscreen_background',
                        },
                        elements: [
                            {
                                text: color_string_1.default.to.hex(backgroundColor.value),
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
 * @param backgroundColor
 */
async function configureColorsXml(androidMainPath, backgroundColor) {
    const filePath = path_1.default.resolve(androidMainPath, COLORS_XML_FILE_PATH);
    const xmlContent = await xml_manipulation_1.readXmlFile(filePath);
    const configuredXmlContent = configureBackgroundColor(xmlContent, backgroundColor);
    await xml_manipulation_1.writeXmlFile(filePath, configuredXmlContent);
}
exports.default = configureColorsXml;
//# sourceMappingURL=Colors.xml.js.map