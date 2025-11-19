"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildOfType = exports.appendScreenStackPropsToOptions = exports.StackScreen = exports.StackHeaderItem = exports.StackHeaderMenuAction = exports.StackHeaderMenu = exports.StackHeaderIcon = exports.StackHeaderLabel = exports.StackHeaderBadge = exports.StackHeaderButton = exports.StackHeaderTitle = exports.StackHeaderSearchBar = exports.StackHeaderRight = exports.StackHeaderLeft = exports.StackHeaderComponent = exports.StackHeaderBackButton = exports.StackHeader = void 0;
const StackHeaderBackButton_1 = require("./StackHeaderBackButton");
Object.defineProperty(exports, "StackHeaderBackButton", { enumerable: true, get: function () { return StackHeaderBackButton_1.StackHeaderBackButton; } });
const StackHeaderButton_1 = require("./StackHeaderButton");
Object.defineProperty(exports, "StackHeaderButton", { enumerable: true, get: function () { return StackHeaderButton_1.StackHeaderButton; } });
const StackHeaderComponent_1 = require("./StackHeaderComponent");
Object.defineProperty(exports, "StackHeaderComponent", { enumerable: true, get: function () { return StackHeaderComponent_1.StackHeaderComponent; } });
const StackHeaderItem_1 = require("./StackHeaderItem");
Object.defineProperty(exports, "StackHeaderItem", { enumerable: true, get: function () { return StackHeaderItem_1.StackHeaderItem; } });
const StackHeaderLeftRight_1 = require("./StackHeaderLeftRight");
Object.defineProperty(exports, "StackHeaderLeft", { enumerable: true, get: function () { return StackHeaderLeftRight_1.StackHeaderLeft; } });
Object.defineProperty(exports, "StackHeaderRight", { enumerable: true, get: function () { return StackHeaderLeftRight_1.StackHeaderRight; } });
const StackHeaderMenu_1 = require("./StackHeaderMenu");
Object.defineProperty(exports, "StackHeaderMenu", { enumerable: true, get: function () { return StackHeaderMenu_1.StackHeaderMenu; } });
Object.defineProperty(exports, "StackHeaderMenuAction", { enumerable: true, get: function () { return StackHeaderMenu_1.StackHeaderMenuAction; } });
const StackHeaderSearchBar_1 = require("./StackHeaderSearchBar");
Object.defineProperty(exports, "StackHeaderSearchBar", { enumerable: true, get: function () { return StackHeaderSearchBar_1.StackHeaderSearchBar; } });
const StackHeaderTitle_1 = require("./StackHeaderTitle");
Object.defineProperty(exports, "StackHeaderTitle", { enumerable: true, get: function () { return StackHeaderTitle_1.StackHeaderTitle; } });
const common_primitives_1 = require("./common-primitives");
Object.defineProperty(exports, "StackHeaderBadge", { enumerable: true, get: function () { return common_primitives_1.StackHeaderBadge; } });
Object.defineProperty(exports, "StackHeaderIcon", { enumerable: true, get: function () { return common_primitives_1.StackHeaderIcon; } });
Object.defineProperty(exports, "StackHeaderLabel", { enumerable: true, get: function () { return common_primitives_1.StackHeaderLabel; } });
exports.StackHeader = Object.assign(StackHeaderComponent_1.StackHeaderComponent, {
    Left: StackHeaderLeftRight_1.StackHeaderLeft,
    Right: StackHeaderLeftRight_1.StackHeaderRight,
    BackButton: StackHeaderBackButton_1.StackHeaderBackButton,
    Title: StackHeaderTitle_1.StackHeaderTitle,
    SearchBar: StackHeaderSearchBar_1.StackHeaderSearchBar,
    Button: StackHeaderButton_1.StackHeaderButton,
    Badge: common_primitives_1.StackHeaderBadge,
    Label: common_primitives_1.StackHeaderLabel,
    Icon: common_primitives_1.StackHeaderIcon,
    Menu: StackHeaderMenu_1.StackHeaderMenu,
    MenuAction: StackHeaderMenu_1.StackHeaderMenuAction,
    Item: StackHeaderItem_1.StackHeaderItem,
});
var StackScreen_1 = require("./StackScreen");
Object.defineProperty(exports, "StackScreen", { enumerable: true, get: function () { return StackScreen_1.StackScreen; } });
Object.defineProperty(exports, "appendScreenStackPropsToOptions", { enumerable: true, get: function () { return StackScreen_1.appendScreenStackPropsToOptions; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "isChildOfType", { enumerable: true, get: function () { return utils_1.isChildOfType; } });
//# sourceMappingURL=index.js.map