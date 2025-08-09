"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = TabTrigger;
exports.convertTabPropsToOptions = convertTabPropsToOptions;
exports.isTab = isTab;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const utils_1 = require("./utils");
const useSafeLayoutEffect_1 = require("../../views/useSafeLayoutEffect");
const elements_1 = require("../common/elements");
function TabTrigger(props) {
    const route = (0, native_1.useRoute)();
    const navigation = (0, native_1.useNavigation)();
    const isFocused = navigation.isFocused();
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        // This will cause the tab to update only when it is focused.
        // As long as all tabs are loaded at the start, we don't need this check.
        // It is here to ensure similar behavior to stack
        if (isFocused) {
            if (navigation.getState()?.type !== 'tab') {
                throw new Error(`Trigger component can only be used in the tab screen. Current route: ${route.name}`);
            }
            const options = convertTabPropsToOptions(props);
            navigation.setOptions(options);
        }
    }, [isFocused, props]);
    return null;
}
function convertTabPropsToOptions({ options, hidden, children, disablePopToTop, disableScrollToTop, }) {
    const initialOptions = {
        ...options,
        hidden: !!hidden,
        specialEffects: {
            repeatedTabSelection: {
                popToRoot: !disablePopToTop,
                scrollToTop: !disableScrollToTop,
            },
        },
    };
    const allowedChildren = (0, utils_1.filterAllowedChildrenElements)(children, [elements_1.Badge, elements_1.Label, elements_1.Icon]);
    return allowedChildren.reduce((acc, child) => {
        if ((0, utils_1.isChildOfType)(child, elements_1.Badge)) {
            if (child.props.children) {
                acc.badgeValue = String(child.props.children);
            }
        }
        else if ((0, utils_1.isChildOfType)(child, elements_1.Label)) {
            acc.title = child.props.children;
        }
        else if ((0, utils_1.isChildOfType)(child, elements_1.Icon)) {
            if ('src' in child.props || 'selectedSrc' in child.props) {
                acc.icon = child.props.src
                    ? {
                        src: child.props.src,
                    }
                    : undefined;
                acc.selectedIcon = child.props.selectedSrc
                    ? {
                        src: child.props.selectedSrc,
                    }
                    : undefined;
            }
            else if ('sf' in child.props || 'selectedSf' in child.props) {
                if (process.env.EXPO_OS === 'ios') {
                    acc.icon = child.props.sf
                        ? {
                            sf: child.props.sf,
                        }
                        : undefined;
                    acc.selectedIcon = child.props.selectedSf
                        ? {
                            sf: child.props.selectedSf,
                        }
                        : undefined;
                }
            }
            if (process.env.EXPO_OS === 'android') {
                acc.icon = { drawable: child.props.drawable };
                acc.selectedIcon = undefined;
            }
        }
        return acc;
    }, { ...initialOptions });
}
function isTab(child, contextKey) {
    if ((0, react_1.isValidElement)(child) && child && child.type === TabTrigger) {
        if (typeof child.props === 'object' &&
            child.props &&
            'name' in child.props &&
            !child.props.name) {
            throw new Error(`<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (['component', 'getComponent'].some((key) => child.props && typeof child.props === 'object' && key in child.props)) {
                throw new Error(`<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`);
            }
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=TabOptions.js.map