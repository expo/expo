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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tab = Tab;
exports.convertTabPropsToOptions = convertTabPropsToOptions;
exports.isTab = isTab;
const react_1 = __importStar(require("react"));
const NavigatorElements_1 = require("./NavigatorElements");
function Tab(props) {
    return null;
}
function convertTabPropsToOptions({ options, children }) {
    const allowedChildren = filterAllowedChildrenElements(children, [NavigatorElements_1.Badge, NavigatorElements_1.Title, NavigatorElements_1.Icon]);
    return allowedChildren.reduce((acc, child) => {
        if (isChildOfType(child, NavigatorElements_1.Badge)) {
            acc.badgeValue = child.props.value;
        }
        else if (isChildOfType(child, NavigatorElements_1.Title)) {
            acc.title = child.props.children;
            if (child.props.style) {
                acc.tabBarItemTitleFontFamily = child.props.style.fontFamily;
                acc.tabBarItemTitleFontSize = child.props.style.fontSize;
                acc.tabBarItemTitleFontWeight = child.props.style.fontWeight;
                acc.tabBarItemTitleFontStyle = child.props.style.fontStyle;
                acc.tabBarItemTitleFontColor = child.props.style.fontColor;
            }
        }
        else if (isChildOfType(child, NavigatorElements_1.Icon)) {
            if ('sfSymbolName' in child.props) {
                acc.iconSFSymbolName = child.props.sfSymbolName;
            }
            else if ('children' in child.props) {
                // TODO: Once there is support for custom icons, we can handle this case
            }
        }
        return acc;
    }, { ...options });
}
function isTab(child, contextKey) {
    if ((0, react_1.isValidElement)(child) && child && child.type === Tab) {
        if (typeof child.props === 'object' &&
            child.props &&
            'name' in child.props &&
            !child.props.name) {
            throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (['children', 'component', 'getComponent'].some((key) => child.props && typeof child.props === 'object' && key in child.props)) {
                throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
            }
        }
        return true;
    }
    return false;
}
function filterAllowedChildrenElements(children, components) {
    return react_1.default.Children.toArray(children).filter((child) => react_1.default.isValidElement(child) && components.includes(child.type));
}
function isChildOfType(child, type) {
    return react_1.default.isValidElement(child) && child.type === type;
}
//# sourceMappingURL=TabOptions.js.map