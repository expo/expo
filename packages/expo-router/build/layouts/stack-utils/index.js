"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildOfType = exports.appendScreenStackPropsToOptions = exports.StackScreen = exports.StackHeaderTitle = exports.StackHeaderSearchBar = exports.StackHeaderRight = exports.StackHeaderLeft = exports.StackHeaderComponent = exports.StackHeaderBackButton = exports.StackHeader = void 0;
const StackHeaderBackButton_1 = require("./StackHeaderBackButton");
Object.defineProperty(exports, "StackHeaderBackButton", { enumerable: true, get: function () { return StackHeaderBackButton_1.StackHeaderBackButton; } });
const StackHeaderComponent_1 = require("./StackHeaderComponent");
Object.defineProperty(exports, "StackHeaderComponent", { enumerable: true, get: function () { return StackHeaderComponent_1.StackHeaderComponent; } });
const StackHeaderLeft_1 = require("./StackHeaderLeft");
Object.defineProperty(exports, "StackHeaderLeft", { enumerable: true, get: function () { return StackHeaderLeft_1.StackHeaderLeft; } });
const StackHeaderRight_1 = require("./StackHeaderRight");
Object.defineProperty(exports, "StackHeaderRight", { enumerable: true, get: function () { return StackHeaderRight_1.StackHeaderRight; } });
const StackHeaderSearchBar_1 = require("./StackHeaderSearchBar");
Object.defineProperty(exports, "StackHeaderSearchBar", { enumerable: true, get: function () { return StackHeaderSearchBar_1.StackHeaderSearchBar; } });
const StackHeaderTitle_1 = require("./StackHeaderTitle");
Object.defineProperty(exports, "StackHeaderTitle", { enumerable: true, get: function () { return StackHeaderTitle_1.StackHeaderTitle; } });
exports.StackHeader = Object.assign(StackHeaderComponent_1.StackHeaderComponent, {
    Left: StackHeaderLeft_1.StackHeaderLeft,
    Right: StackHeaderRight_1.StackHeaderRight,
    BackButton: StackHeaderBackButton_1.StackHeaderBackButton,
    Title: StackHeaderTitle_1.StackHeaderTitle,
    SearchBar: StackHeaderSearchBar_1.StackHeaderSearchBar,
});
var StackScreen_1 = require("./StackScreen");
Object.defineProperty(exports, "StackScreen", { enumerable: true, get: function () { return StackScreen_1.StackScreen; } });
Object.defineProperty(exports, "appendScreenStackPropsToOptions", { enumerable: true, get: function () { return StackScreen_1.appendScreenStackPropsToOptions; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "isChildOfType", { enumerable: true, get: function () { return utils_1.isChildOfType; } });
//# sourceMappingURL=index.js.map