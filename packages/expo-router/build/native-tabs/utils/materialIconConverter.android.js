"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMaterialIconNameToImageSource = convertMaterialIconNameToImageSource;
const MaterialIcons_1 = __importDefault(require("@expo/vector-icons/MaterialIcons"));
const icon_1 = require("./icon");
const elements_1 = require("../common/elements");
function convertMaterialIconNameToImageSource(name) {
    return (0, icon_1.convertComponentSrcToImageSource)(<elements_1.NativeTabsTriggerVectorIcon family={MaterialIcons_1.default} name={name}/>);
}
//# sourceMappingURL=materialIconConverter.android.js.map