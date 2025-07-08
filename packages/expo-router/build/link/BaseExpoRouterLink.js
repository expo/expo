"use strict";
'use client';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseExpoRouterLink = BaseExpoRouterLink;
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const href_1 = require("./href");
const useLinkHooks_1 = require("./useLinkHooks");
const useLinkToPathProps_1 = __importDefault(require("./useLinkToPathProps"));
const Prefetch_1 = require("../Prefetch");
const Slot_1 = require("../ui/Slot");
function BaseExpoRouterLink({ href, replace, push, dismissTo, 
// TODO: This does not prevent default on the anchor tag.
relativeToDirectory, asChild, rel, target, download, withAnchor, dangerouslySingular: singular, prefetch, ...rest }) {
    // Mutate the style prop to add the className on web.
    const style = (0, useLinkHooks_1.useInteropClassName)(rest);
    // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
    const hrefAttrs = (0, useLinkHooks_1.useHrefAttrs)({ asChild, rel, target, download });
    const resolvedHref = (0, react_1.useMemo)(() => {
        if (href == null) {
            throw new Error('Link: href is required');
        }
        return (0, href_1.resolveHref)(href);
    }, [href]);
    let event;
    if (push)
        event = 'PUSH';
    if (replace)
        event = 'REPLACE';
    if (dismissTo)
        event = 'POP_TO';
    const props = (0, useLinkToPathProps_1.default)({
        href: resolvedHref,
        event,
        relativeToDirectory,
        withAnchor,
        dangerouslySingular: singular,
    });
    const onPress = (e) => {
        if ('onPress' in rest) {
            rest.onPress?.(e);
        }
        props.onPress(e);
    };
    const Component = asChild ? Slot_1.Slot : react_native_1.Text;
    if (asChild && react_1.default.Children.count(rest.children) > 1) {
        throw new Error('Link: When using `asChild`, you must pass a single child element that will emit the `onPress` event.');
    }
    // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
    const element = (<Component {...props} {...hrefAttrs} {...rest} style={style} {...react_native_1.Platform.select({
        web: {
            onClick: onPress,
        },
        default: { onPress },
    })}/>);
    return prefetch ? (<>
      <Prefetch_1.Prefetch href={href}/>
      {element}
    </>) : (element);
}
//# sourceMappingURL=BaseExpoRouterLink.js.map