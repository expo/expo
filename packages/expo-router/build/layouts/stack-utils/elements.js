"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeader = void 0;
exports.StackHeaderComponent = StackHeaderComponent;
exports.StackHeaderLeft = StackHeaderLeft;
exports.StackHeaderRight = StackHeaderRight;
exports.StackHeaderBackButton = StackHeaderBackButton;
exports.StackHeaderTitle = StackHeaderTitle;
exports.StackHeaderSearchBar = StackHeaderSearchBar;
exports.StackScreen = StackScreen;
const Screen_1 = require("../../views/Screen");
function StackHeaderComponent(props) {
    return null;
}
function StackHeaderLeft(props) {
    return null;
}
function StackHeaderRight(props) {
    return null;
}
function StackHeaderBackButton(props) {
    return null;
}
function StackHeaderTitle(props) {
    return null;
}
function StackHeaderSearchBar(props) {
    return null;
}
function StackScreen({ children, ...rest }) {
    return <Screen_1.Screen {...rest}/>;
}
exports.StackHeader = Object.assign(StackHeaderComponent, {
    Left: StackHeaderLeft,
    Right: StackHeaderRight,
    BackButton: StackHeaderBackButton,
    Title: StackHeaderTitle,
    SearchBar: StackHeaderSearchBar,
});
//# sourceMappingURL=elements.js.map