"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const AndroidManifest_xml_1 = __importDefault(require("./AndroidManifest.xml"));
const Colors_xml_1 = __importDefault(require("./Colors.xml"));
const Drawable_xml_1 = __importDefault(require("./Drawable.xml"));
const Drawables_1 = __importDefault(require("./Drawables"));
const MainActivity_1 = __importDefault(require("./MainActivity"));
const Styles_xml_1 = __importDefault(require("./Styles.xml"));
async function configureAndroid(projectRootPath, { imagePath, resizeMode, backgroundColor, }) {
    const androidMainPath = path_1.default.resolve(projectRootPath, 'android/app/src/main');
    await Promise.all([
        Drawables_1.default(androidMainPath, imagePath),
        Colors_xml_1.default(androidMainPath, backgroundColor),
        Drawable_xml_1.default(androidMainPath, resizeMode),
        Styles_xml_1.default(androidMainPath),
        AndroidManifest_xml_1.default(androidMainPath),
        MainActivity_1.default(projectRootPath, resizeMode),
    ]);
}
exports.default = configureAndroid;
//# sourceMappingURL=index.js.map