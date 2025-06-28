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
exports.LinkWithPreview = LinkWithPreview;
exports.LinkMenuAction = LinkMenuAction;
exports.LinkMenu = LinkMenu;
exports.LinkPreview = LinkPreview;
exports.LinkTrigger = LinkTrigger;
const react_1 = __importStar(require("react"));
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
    const router = (0, hooks_1.useRouter)();
    const { setIsPreviewOpen } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
    const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = (0, react_1.useState)(false);
    const hrefWithoutQuery = String(rest.href).split('?')[0];
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
    (0, react_1.useEffect)(() => {
        if ((0, url_1.shouldLinkExternally)(String(rest.href))) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('External links previews are not supported');
            }
            else {
                console.warn('External links previews are not supported');
            }
        }
        if (rest.replace) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Using replace links with preview is not supported');
            }
            else {
                console.warn('Using replace links with preview is not supported');
            }
        }
    }, [rest.href, rest.replace]);
    const triggerElement = react_1.default.useMemo(() => getFirstChildOfType(children, LinkTrigger), [children]);
    const menuElement = react_1.default.useMemo(() => getFirstChildOfType(children, LinkMenu), [children]);
    const previewElement = react_1.default.useMemo(() => getFirstChildOfType(children, LinkPreview), [children]);
    if (previewElement && !triggerElement) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('When you use Link.Preview, you must use Link.Trigger to specify the trigger element.');
        }
        else {
            console.warn('When you use Link.Preview, you must use Link.Trigger to specify the trigger element.');
        }
    }
    const trigger = react_1.default.useMemo(() => triggerElement ?? <LinkTrigger>{children}</LinkTrigger>, [triggerElement, children]);
    const actionsHandlers = react_1.default.useMemo(() => convertActionsToActionsHandlers(convertChildrenArrayToActions(react_1.default.Children.toArray(menuElement?.props.children))), [menuElement]);
    const preview = react_1.default.useMemo(() => previewElement ?? <LinkPreview />, [previewElement, rest.href]);
    if ((0, url_1.shouldLinkExternally)(String(rest.href)) || rest.replace) {
        return <BaseExpoRouterLink_1.BaseExpoRouterLink children={children} {...rest}/>;
    }
    return (<native_1.NativeLinkPreview nextScreenId={nextScreenId} onActionSelected={({ nativeEvent: { id } }) => {
            actionsHandlers[id]?.();
        }} onWillPreviewOpen={() => {
            router.prefetch(rest.href);
            setIsPreviewOpen(true);
            setIsCurrenPreviewOpen(true);
        }} onDidPreviewOpen={() => {
            updateNextScreenId(rest.href);
        }} onPreviewDidClose={() => {
            setIsPreviewOpen(false);
            setIsCurrenPreviewOpen(false);
        }} onPreviewTapped={() => {
            router.navigate(rest.href, { __internal__PreviewKey: nextScreenId });
        }}>
      <InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href: rest.href }}>
        <native_1.NativeLinkPreviewTrigger>
          <BaseExpoRouterLink_1.BaseExpoRouterLink {...rest} children={trigger} ref={rest.ref}/>
        </native_1.NativeLinkPreviewTrigger>
        {preview}
        {menuElement}
      </InternalLinkPreviewContext>
    </native_1.NativeLinkPreview>);
}
function LinkMenuAction(_) {
    return null;
}
function LinkMenu({ children }) {
    if ((0, PreviewRouteContext_1.useIsPreview)() || !(0, react_1.use)(InternalLinkPreviewContext)) {
        return null;
    }
    return convertChildrenArrayToActions(react_1.default.Children.toArray(children)).map((action) => {
        return <native_1.NativeLinkPreviewAction key={action.id} title={action.title} id={action.id}/>;
    });
}
function LinkPreview({ children, width, height }) {
    const internalPreviewContext = (0, react_1.use)(InternalLinkPreviewContext);
    if ((0, PreviewRouteContext_1.useIsPreview)() || !internalPreviewContext) {
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
    if (react_1.default.Children.toArray(props.children).every((child) => !(0, react_1.isValidElement)(child))) {
        return props.children;
    }
    return <Slot_1.Slot {...props}/>;
}
function getFirstChildOfType(children, type) {
    return react_1.default.Children.toArray(children).find((child) => (0, react_1.isValidElement)(child) && child.type === type);
}
function convertActionsToActionsHandlers(items) {
    return (items ?? []).reduce((acc, item) => ({
        ...acc,
        [item.id]: item.onPress,
    }), {});
}
function convertChildrenArrayToActions(children) {
    return children
        .filter((item) => (0, react_1.isValidElement)(item) && item.type === LinkMenuAction)
        .map((child, index) => ({
        id: `${child.props.title}-${index}`,
        title: child.props.title,
        onPress: child.props.onPress,
    }));
}
//# sourceMappingURL=LinkWithPreview.js.map