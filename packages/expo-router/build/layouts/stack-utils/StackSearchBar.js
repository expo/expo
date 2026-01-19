"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackSearchBar = StackSearchBar;
exports.appendStackSearchBarPropsToOptions = appendStackSearchBarPropsToOptions;
const react_1 = require("react");
const Screen_1 = require("../../views/Screen");
function StackSearchBar(props) {
    const updatedOptions = (0, react_1.useMemo)(() => appendStackSearchBarPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
}
function appendStackSearchBarPropsToOptions(options, props) {
    return {
        ...options,
        headerSearchBarOptions: {
            ...props,
        },
    };
}
//# sourceMappingURL=StackSearchBar.js.map