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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkMenu = void 0;
exports.LinkWithPreview = LinkWithPreview;
exports.LinkMenuAction = LinkMenuAction;
exports.LinkPreview = LinkPreview;
exports.LinkTrigger = LinkTrigger;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const hooks_1 = require("../hooks");
const BaseExpoRouterLink_1 = require("./BaseExpoRouterLink");
const HrefPreview_1 = require("./preview/HrefPreview");
const LinkPreviewContext_1 = require("./preview/LinkPreviewContext");
const native_1 = require("./preview/native");
const useNextScreenId_1 = require("./preview/useNextScreenId");
const url_1 = require("../utils/url");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
const Slot_1 = require("../ui/Slot");
const InternalLinkPreviewContext = (0, react_1.createContext)(undefined);
function LinkWithPreview({ children, ...rest }) {
    (0, react_1.useEffect)(() => {
        if ((0, url_1.shouldLinkExternally)(String(rest.href))) {
            throw new Error('External links previews are not supported');
        }
        if (rest.replace) {
            throw new Error('Using replace links with preview is not supported');
        }
    }, [rest.href, rest.replace]);
    return (<BaseExpoRouterLink_1.BaseExpoRouterLink {...rest} asChild>
      <InnerLinkWithPreview href={rest.href} asChild={rest.asChild}>
        {children}
      </InnerLinkWithPreview>
    </BaseExpoRouterLink_1.BaseExpoRouterLink>);
}
function InnerLinkWithPreview({ children, asChild, href, style, onPress, onClick, }) {
    const router = (0, hooks_1.useRouter)();
    const { setIsPreviewOpen } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
    const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = (0, react_1.useState)(false);
    const hrefWithoutQuery = String(href).split('?')[0];
    const prevHrefWithoutQuery = (0, react_1.useRef)(hrefWithoutQuery);
    (0, react_1.useEffect)(() => {
        if (isCurrentPreviewOpen) {
            if (prevHrefWithoutQuery.current !== hrefWithoutQuery) {
                throw new Error('Link does not support changing the href prop after the preview has been opened. Please ensure that the href prop is stable and does not change between renders.');
            }
        }
        else {
            prevHrefWithoutQuery.current = hrefWithoutQuery;
        }
    }, [hrefWithoutQuery]);
    const [nextScreenId, updateNextScreenId] = (0, useNextScreenId_1.useNextScreenId)();
    const triggerElement = react_1.default.useMemo(() => getFirstChildOfType(children, LinkTrigger), [children]);
    const menuElement = react_1.default.useMemo(() => getFirstChildOfType(children, exports.LinkMenu), [children]);
    const actionsHandlers = react_1.default.useMemo(() => menuElement
        ? convertActionsToActionsHandlers(convertChildrenArrayToActions([menuElement]))
        : {}, [menuElement]);
    const previewElement = react_1.default.useMemo(() => getFirstChildOfType(children, LinkPreview), [children]);
    if (!previewElement) {
        throw new Error('No <Link.Preview> found. This is likely a bug in expo-router.');
    }
    if (!triggerElement) {
        throw new Error('When you use <Link.Preview>, you must use <Link.Trigger> to specify the trigger element.');
    }
    const componentStyle = (0, react_1.useMemo)(
    // `style` will be passed through the slot in BaseExpoRouterLink, because asChild is used
    () => react_native_1.StyleSheet.flatten([style, triggerElement.props.style]), [style, triggerElement.props.style]);
    const triggerComponentStyle = (0, react_1.useMemo)(() => {
        // If asChild is used, then the style should be applied directly to the child element
        // Component styles will be applied to native element
        if (asChild) {
            return {};
        }
        // When flex is set on Link.Trigger or Link then the trigger should fill the available space
        if (componentStyle.flex !== undefined) {
            return react_native_1.StyleSheet.flatten([componentStyle, { flex: 1 }]);
        }
        return componentStyle;
    }, [componentStyle]);
    const nativeLinkPreviewStyle = (0, react_1.useMemo)(() => {
        // Is asChild is used, then the style should be applied to the native element
        if (asChild) {
            return componentStyle;
        }
        // When flex is set on Link.Trigger or Link then the native element should have the flex,
        // because it is the outer container
        if (componentStyle && componentStyle.flex !== undefined) {
            return {
                flex: componentStyle.flex,
            };
        }
        // Otherwise, styles will be applied to the Text element
        return {};
    }, [asChild, componentStyle]);
    // Copying the behavior of BaseExpoRouterLink
    const Component = asChild ? Slot_1.Slot : react_native_1.Text;
    return (<native_1.NativeLinkPreview style={nativeLinkPreviewStyle} nextScreenId={nextScreenId} onActionSelected={({ nativeEvent: { id } }) => {
            actionsHandlers[id]?.();
        }} onWillPreviewOpen={() => {
            router.prefetch(href);
            setIsPreviewOpen(true);
            setIsCurrenPreviewOpen(true);
        }} onDidPreviewOpen={() => {
            updateNextScreenId(href);
        }} onPreviewDidClose={() => {
            setIsPreviewOpen(false);
            setIsCurrenPreviewOpen(false);
        }} onPreviewTapped={() => {
            router.navigate(href, { __internal__PreviewKey: nextScreenId });
        }}>
      <InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href }}>
        <Component {...triggerElement.props} 
    // @ts-expect-error
    style={triggerComponentStyle ?? undefined} onPress={onPress} onClick={onClick}/>
        {previewElement}
        {menuElement}
      </InternalLinkPreviewContext>
    </native_1.NativeLinkPreview>);
}
function LinkMenuAction(_) {
    return null;
}
const LinkMenu = (props) => {
    if ((0, PreviewRouteContext_1.useIsPreview)() || process.env.EXPO_OS !== 'ios' || !(0, react_1.use)(InternalLinkPreviewContext)) {
        return null;
    }
    return convertActionsToNativeElements(convertChildrenArrayToActions([(0, react_1.createElement)(exports.LinkMenu, props, props.children)]));
};
exports.LinkMenu = LinkMenu;
function convertActionsToNativeElements(actions) {
    return actions.map(({ children, onPress, ...props }) => (<native_1.NativeLinkPreviewAction {...props} key={props.id} children={convertActionsToNativeElements(children)}/>));
}
function LinkPreview({ children, width, height }) {
    const internalPreviewContext = (0, react_1.use)(InternalLinkPreviewContext);
    if ((0, PreviewRouteContext_1.useIsPreview)() || process.env.EXPO_OS !== 'ios' || !internalPreviewContext) {
        return null;
    }
    const { isVisible, href } = internalPreviewContext;
    const contentSize = {
        width: width ?? 0,
        height: height ?? 0,
    };
    let content;
    if (children) {
        content = isVisible ? children : null;
    }
    else {
        content = isVisible ? <HrefPreview_1.HrefPreview href={href}/> : null;
    }
    return (<native_1.NativeLinkPreviewContent style={{
            /* Setting default background here, so that the preview is not transparent */
            backgroundColor: '#fff',
        }} preferredContentSize={contentSize}>
      {content}
    </native_1.NativeLinkPreviewContent>);
}
function LinkTrigger(props) {
    if (react_1.default.Children.count(props.children) > 1 || !(0, react_1.isValidElement)(props.children)) {
        // If onPress is passed, this means that Link passed props to this component.
        // We can assume that asChild is used, so we throw an error, because link will not work in this case.
        if (props && typeof props === 'object' && 'onPress' in props) {
            throw new Error('When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.');
        }
        return props.children;
    }
    // @ts-expect-error
    return <Slot_1.Slot {...props}/>;
}
function getFirstChildOfType(children, type) {
    return react_1.default.Children.toArray(children).find((child) => (0, react_1.isValidElement)(child) && child.type === type);
}
function convertActionsToActionsHandlers(items) {
    return flattenActions(items ?? []).reduce((acc, item) => ({
        ...acc,
        [item.id]: item.onPress,
    }), {});
}
function flattenActions(actions) {
    return actions.reduce((acc, action) => {
        if (action.children.length > 0) {
            return [...acc, action, ...flattenActions(action.children)];
        }
        return [...acc, action];
    }, []);
}
function convertChildrenArrayToActions(children, parentId = '') {
    return children
        .filter((item) => (0, react_1.isValidElement)(item) && (item.type === LinkMenuAction || item.type === exports.LinkMenu))
        .map((child, index) => ({
        id: `${parentId}${child.props.title}-${index}`,
        title: child.props.title ?? '',
        onPress: 'onPress' in child.props ? child.props.onPress : () => { },
        icon: child.props.icon,
        children: 'children' in child.props
            ? convertChildrenArrayToActions(react_1.default.Children.toArray(child.props.children), `${parentId}${child.props.title}-${index}`)
            : [],
    }));
}
//# sourceMappingURL=LinkWithPreview.js.map