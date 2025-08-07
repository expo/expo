"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = TabTrigger;
exports.convertTabPropsToOptions = convertTabPropsToOptions;
exports.isTab = isTab;
const react_1 = require("react");
const utils_1 = require("./utils");
const elements_1 = require("../common/elements");
function TabTrigger(props) {
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