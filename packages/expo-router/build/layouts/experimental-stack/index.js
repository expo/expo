"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentalStack = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const createExperimentalStackNavigator_1 = require("./createExperimentalStackNavigator");
const StackClient_1 = require("../StackClient");
const stack_utils_1 = require("../stack-utils");
const withLayoutContext_1 = require("../withLayoutContext");
const children_1 = require("../../utils/children");
const Protected_1 = require("../../views/Protected");
const ExperimentalStackNavigator = (0, createExperimentalStackNavigator_1.createExperimentalStackNavigator)().Navigator;
const RNExperimentalStack = (0, withLayoutContext_1.withLayoutContext)(ExperimentalStackNavigator);
/**
 * Renders the new `react-native-screens/experimental` native stack.
 *
 * Sibling to `Stack`. Native-only — on web it falls back to the standard `Stack`.
 * Opt-in per navigator: replace `<Stack />` with `<ExperimentalStack />` in the
 * specific layout you want to migrate.
 *
 * @experimental
 */
const ExperimentalStack = Object.assign((props) => {
    const rnChildren = (0, react_1.useMemo)(() => {
        const filtered = react_1.Children.toArray(props.children).filter((child) => !(0, children_1.isChildOfType)(child, stack_utils_1.StackHeader));
        return (0, stack_utils_1.mapProtectedScreen)({ guard: true, children: filtered }).children;
    }, [props.children]);
    return ((0, jsx_runtime_1.jsx)(RNExperimentalStack, { ...props, children: rnChildren, UNSTABLE_router: StackClient_1.stackRouterOverride }));
}, {
    Screen: stack_utils_1.StackScreen,
    Protected: Protected_1.Protected,
});
exports.ExperimentalStack = ExperimentalStack;
exports.default = ExperimentalStack;
//# sourceMappingURL=index.js.map