"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendScreenStackPropsToOptions = exports.StackScreen = exports.StackHeaderSpacer = exports.StackHeaderView = exports.StackHeaderMenuAction = exports.StackHeaderMenu = exports.StackHeaderIcon = exports.StackHeaderLabel = exports.StackHeaderBadge = exports.StackHeaderButton = exports.StackHeaderTitle = exports.StackSearchBar = exports.StackHeaderRight = exports.StackHeaderLeft = exports.StackHeaderBackButton = exports.StackHeader = void 0;
const StackHeaderBackButton_1 = require("./StackHeaderBackButton");
Object.defineProperty(exports, "StackHeaderBackButton", { enumerable: true, get: function () { return StackHeaderBackButton_1.StackHeaderBackButton; } });
const StackHeaderButton_1 = require("./StackHeaderButton");
Object.defineProperty(exports, "StackHeaderButton", { enumerable: true, get: function () { return StackHeaderButton_1.StackHeaderButton; } });
const StackHeaderComponent_1 = require("./StackHeaderComponent");
const StackHeaderLeftRight_1 = require("./StackHeaderLeftRight");
Object.defineProperty(exports, "StackHeaderLeft", { enumerable: true, get: function () { return StackHeaderLeftRight_1.StackHeaderLeft; } });
Object.defineProperty(exports, "StackHeaderRight", { enumerable: true, get: function () { return StackHeaderLeftRight_1.StackHeaderRight; } });
const StackHeaderMenu_1 = require("./StackHeaderMenu");
Object.defineProperty(exports, "StackHeaderMenu", { enumerable: true, get: function () { return StackHeaderMenu_1.StackHeaderMenu; } });
Object.defineProperty(exports, "StackHeaderMenuAction", { enumerable: true, get: function () { return StackHeaderMenu_1.StackHeaderMenuAction; } });
const StackHeaderSpacer_1 = require("./StackHeaderSpacer");
Object.defineProperty(exports, "StackHeaderSpacer", { enumerable: true, get: function () { return StackHeaderSpacer_1.StackHeaderSpacer; } });
const StackHeaderTitle_1 = require("./StackHeaderTitle");
Object.defineProperty(exports, "StackHeaderTitle", { enumerable: true, get: function () { return StackHeaderTitle_1.StackHeaderTitle; } });
const StackHeaderView_1 = require("./StackHeaderView");
Object.defineProperty(exports, "StackHeaderView", { enumerable: true, get: function () { return StackHeaderView_1.StackHeaderView; } });
const StackSearchBar_1 = require("./StackSearchBar");
Object.defineProperty(exports, "StackSearchBar", { enumerable: true, get: function () { return StackSearchBar_1.StackSearchBar; } });
const common_primitives_1 = require("./common-primitives");
Object.defineProperty(exports, "StackHeaderBadge", { enumerable: true, get: function () { return common_primitives_1.StackHeaderBadge; } });
Object.defineProperty(exports, "StackHeaderIcon", { enumerable: true, get: function () { return common_primitives_1.StackHeaderIcon; } });
Object.defineProperty(exports, "StackHeaderLabel", { enumerable: true, get: function () { return common_primitives_1.StackHeaderLabel; } });
exports.StackHeader = Object.assign(StackHeaderComponent_1.StackHeaderComponent, {
    Left: StackHeaderLeftRight_1.StackHeaderLeft,
    Right: StackHeaderLeftRight_1.StackHeaderRight,
    BackButton: StackHeaderBackButton_1.StackHeaderBackButton,
    Title: StackHeaderTitle_1.StackHeaderTitle,
    Button: StackHeaderButton_1.StackHeaderButton,
    Badge: common_primitives_1.StackHeaderBadge,
    Label: common_primitives_1.StackHeaderLabel,
    Icon: common_primitives_1.StackHeaderIcon,
    Menu: StackHeaderMenu_1.StackHeaderMenu,
    MenuAction: StackHeaderMenu_1.StackHeaderMenuAction,
    View: StackHeaderView_1.StackHeaderView,
    Spacer: StackHeaderSpacer_1.StackHeaderSpacer,
});
var StackScreen_1 = require("./StackScreen");
Object.defineProperty(exports, "StackScreen", { enumerable: true, get: function () { return StackScreen_1.StackScreen; } });
Object.defineProperty(exports, "appendScreenStackPropsToOptions", { enumerable: true, get: function () { return StackScreen_1.appendScreenStackPropsToOptions; } });
//# sourceMappingURL=index.js.map