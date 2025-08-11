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
const react_1 = __importStar(require("react"));
const hooks_1 = require("../hooks");
const BaseExpoRouterLink_1 = require("./BaseExpoRouterLink");
const InternalLinkPreviewContext_1 = require("./InternalLinkPreviewContext");
const elements_1 = require("./elements");
const LinkPreviewContext_1 = require("./preview/LinkPreviewContext");
const native_1 = require("./preview/native");
const useNextScreenId_1 = require("./preview/useNextScreenId");
const url_1 = require("../utils/url");
function LinkWithPreview({ children, ...rest }) {
    const router = (0, hooks_1.useRouter)();
    const { setOpenPreviewKey } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
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
    const [{ nextScreenId, tabPath }, prefetch] = (0, useNextScreenId_1.useNextScreenId)();
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
    const triggerElement = react_1.default.useMemo(() => getFirstChildOfType(children, elements_1.LinkTrigger), [children]);
    const menuElement = react_1.default.useMemo(() => getFirstChildOfType(children, elements_1.LinkMenu), [children]);
    const previewElement = react_1.default.useMemo(() => getFirstChildOfType(children, elements_1.LinkPreview), [children]);
    if ((previewElement || menuElement) && !triggerElement) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('When you use Link.Preview, you must use Link.Trigger to specify the trigger element.');
        }
        else {
            console.warn('When you use Link.Preview, you must use Link.Trigger to specify the trigger element.');
        }
    }
    const trigger = react_1.default.useMemo(() => triggerElement ?? <elements_1.LinkTrigger>{children}</elements_1.LinkTrigger>, [triggerElement, children]);
    const preview = react_1.default.useMemo(() => previewElement ?? null, [previewElement, rest.href]);
    const isPreviewTapped = (0, react_1.useRef)(false);
    const tabPathValue = (0, react_1.useMemo)(() => ({
        path: tabPath,
    }), [tabPath]);
    if ((0, url_1.shouldLinkExternally)(String(rest.href)) || rest.replace) {
        return <BaseExpoRouterLink_1.BaseExpoRouterLink children={children} {...rest}/>;
    }
    return (<native_1.NativeLinkPreview nextScreenId={nextScreenId} tabPath={tabPathValue} onWillPreviewOpen={() => {
            isPreviewTapped.current = false;
            prefetch(rest.href);
            setIsCurrenPreviewOpen(true);
        }} onPreviewWillClose={() => {
            setIsCurrenPreviewOpen(false);
            // When preview was not tapped, then we need to enable the screen stack animation
            // Otherwise this will happen in StackNavigator, when new screen is opened
            if (!isPreviewTapped.current) {
                setOpenPreviewKey(undefined);
            }
        }} onPreviewTapped={() => {
            isPreviewTapped.current = true;
            router.navigate(rest.href, { __internal__PreviewKey: nextScreenId });
        }}>
      <InternalLinkPreviewContext_1.InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href: rest.href }}>
        <native_1.NativeLinkPreviewTrigger>
          <BaseExpoRouterLink_1.BaseExpoRouterLink {...rest} children={trigger} ref={rest.ref}/>
        </native_1.NativeLinkPreviewTrigger>
        {preview}
        {menuElement}
      </InternalLinkPreviewContext_1.InternalLinkPreviewContext>
    </native_1.NativeLinkPreview>);
}
function getFirstChildOfType(children, type) {
    return react_1.default.Children.toArray(children).find((child) => (0, react_1.isValidElement)(child) && child.type === type);
}
//# sourceMappingURL=LinkWithPreview.js.map