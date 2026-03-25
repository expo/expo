"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assets = exports.useFrameSize = exports.Text = exports.Screen = exports.SafeAreaProviderCompat = exports.ResourceSavingView = exports.PlatformPressable = exports.MissingIcon = exports.Lazy = exports.Label = exports.getLabel = exports.useHeaderHeight = exports.HeaderTitle = exports.HeaderShownContext = exports.HeaderHeightContext = exports.HeaderButton = exports.HeaderBackground = exports.HeaderBackContext = exports.HeaderBackButton = exports.Header = exports.getHeaderTitle = exports.getDefaultHeaderHeight = exports.getDefaultSidebarWidth = exports.Button = exports.Badge = exports.Background = void 0;
const back_icon_mask_png_1 = __importDefault(require("../../../assets/react-navigation/elements/back-icon-mask.png"));
const back_icon_png_1 = __importDefault(require("../../../assets/react-navigation/elements/back-icon.png"));
const clear_icon_png_1 = __importDefault(require("../../../assets/react-navigation/elements/clear-icon.png"));
const close_icon_png_1 = __importDefault(require("../../../assets/react-navigation/elements/close-icon.png"));
const search_icon_png_1 = __importDefault(require("../../../assets/react-navigation/elements/search-icon.png"));
var Background_1 = require("./Background");
Object.defineProperty(exports, "Background", { enumerable: true, get: function () { return Background_1.Background; } });
var Badge_1 = require("./Badge");
Object.defineProperty(exports, "Badge", { enumerable: true, get: function () { return Badge_1.Badge; } });
var Button_1 = require("./Button");
Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return Button_1.Button; } });
var getDefaultSidebarWidth_1 = require("./getDefaultSidebarWidth");
Object.defineProperty(exports, "getDefaultSidebarWidth", { enumerable: true, get: function () { return getDefaultSidebarWidth_1.getDefaultSidebarWidth; } });
var getDefaultHeaderHeight_1 = require("./Header/getDefaultHeaderHeight");
Object.defineProperty(exports, "getDefaultHeaderHeight", { enumerable: true, get: function () { return getDefaultHeaderHeight_1.getDefaultHeaderHeight; } });
var getHeaderTitle_1 = require("./Header/getHeaderTitle");
Object.defineProperty(exports, "getHeaderTitle", { enumerable: true, get: function () { return getHeaderTitle_1.getHeaderTitle; } });
var Header_1 = require("./Header/Header");
Object.defineProperty(exports, "Header", { enumerable: true, get: function () { return Header_1.Header; } });
var HeaderBackButton_1 = require("./Header/HeaderBackButton");
Object.defineProperty(exports, "HeaderBackButton", { enumerable: true, get: function () { return HeaderBackButton_1.HeaderBackButton; } });
var HeaderBackContext_1 = require("./Header/HeaderBackContext");
Object.defineProperty(exports, "HeaderBackContext", { enumerable: true, get: function () { return HeaderBackContext_1.HeaderBackContext; } });
var HeaderBackground_1 = require("./Header/HeaderBackground");
Object.defineProperty(exports, "HeaderBackground", { enumerable: true, get: function () { return HeaderBackground_1.HeaderBackground; } });
var HeaderButton_1 = require("./Header/HeaderButton");
Object.defineProperty(exports, "HeaderButton", { enumerable: true, get: function () { return HeaderButton_1.HeaderButton; } });
var HeaderHeightContext_1 = require("./Header/HeaderHeightContext");
Object.defineProperty(exports, "HeaderHeightContext", { enumerable: true, get: function () { return HeaderHeightContext_1.HeaderHeightContext; } });
var HeaderShownContext_1 = require("./Header/HeaderShownContext");
Object.defineProperty(exports, "HeaderShownContext", { enumerable: true, get: function () { return HeaderShownContext_1.HeaderShownContext; } });
var HeaderTitle_1 = require("./Header/HeaderTitle");
Object.defineProperty(exports, "HeaderTitle", { enumerable: true, get: function () { return HeaderTitle_1.HeaderTitle; } });
var useHeaderHeight_1 = require("./Header/useHeaderHeight");
Object.defineProperty(exports, "useHeaderHeight", { enumerable: true, get: function () { return useHeaderHeight_1.useHeaderHeight; } });
var getLabel_1 = require("./Label/getLabel");
Object.defineProperty(exports, "getLabel", { enumerable: true, get: function () { return getLabel_1.getLabel; } });
var Label_1 = require("./Label/Label");
Object.defineProperty(exports, "Label", { enumerable: true, get: function () { return Label_1.Label; } });
var Lazy_1 = require("./Lazy");
Object.defineProperty(exports, "Lazy", { enumerable: true, get: function () { return Lazy_1.Lazy; } });
var MissingIcon_1 = require("./MissingIcon");
Object.defineProperty(exports, "MissingIcon", { enumerable: true, get: function () { return MissingIcon_1.MissingIcon; } });
var PlatformPressable_1 = require("./PlatformPressable");
Object.defineProperty(exports, "PlatformPressable", { enumerable: true, get: function () { return PlatformPressable_1.PlatformPressable; } });
var ResourceSavingView_1 = require("./ResourceSavingView");
Object.defineProperty(exports, "ResourceSavingView", { enumerable: true, get: function () { return ResourceSavingView_1.ResourceSavingView; } });
var SafeAreaProviderCompat_1 = require("./SafeAreaProviderCompat");
Object.defineProperty(exports, "SafeAreaProviderCompat", { enumerable: true, get: function () { return SafeAreaProviderCompat_1.SafeAreaProviderCompat; } });
var Screen_1 = require("./Screen");
Object.defineProperty(exports, "Screen", { enumerable: true, get: function () { return Screen_1.Screen; } });
var Text_1 = require("./Text");
Object.defineProperty(exports, "Text", { enumerable: true, get: function () { return Text_1.Text; } });
var useFrameSize_1 = require("./useFrameSize");
Object.defineProperty(exports, "useFrameSize", { enumerable: true, get: function () { return useFrameSize_1.useFrameSize; } });
exports.Assets = [back_icon_png_1.default, back_icon_mask_png_1.default, search_icon_png_1.default, close_icon_png_1.default, clear_icon_png_1.default];
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map