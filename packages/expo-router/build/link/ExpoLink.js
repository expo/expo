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
exports.ExpoLink = ExpoLink;
const react_1 = __importStar(require("react"));
const BaseExpoRouterLink_1 = require("./BaseExpoRouterLink");
const LinkWithPreview_1 = require("./LinkWithPreview");
const elements_1 = require("./elements");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
const useZoomHref_1 = require("./zoom/useZoomHref");
const url_1 = require("../utils/url");
const zoom_transition_context_providers_1 = require("./zoom/zoom-transition-context-providers");
function ExpoLink(props) {
    return (<zoom_transition_context_providers_1.ZoomTransitionSourceContextProvider linkProps={props}>
      <ExpoLinkImpl {...props}/>
    </zoom_transition_context_providers_1.ZoomTransitionSourceContextProvider>);
}
function ExpoLinkImpl(props) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    const href = (0, useZoomHref_1.useZoomHref)(props);
    const shouldUseLinkWithPreview = process.env.EXPO_OS === 'ios' && isLinkWithPreview(props) && !isPreview;
    if (shouldUseLinkWithPreview) {
        return <LinkWithPreview_1.LinkWithPreview {...props} href={href} hrefForPreviewNavigation={props.href}/>;
    }
    let children = props.children;
    if (react_1.default.Children.count(props.children) > 1) {
        const arrayChildren = react_1.default.Children.toArray(props.children).filter((child) => !(0, react_1.isValidElement)(child) || (child.type !== elements_1.LinkPreview && child.type !== elements_1.LinkMenu));
        children = arrayChildren.length === 1 ? arrayChildren[0] : props.children;
    }
    return <BaseExpoRouterLink_1.BaseExpoRouterLink {...props} href={href} children={children}/>;
}
function isLinkWithPreview(props) {
    const isExternal = (0, url_1.shouldLinkExternally)(String(props.href));
    return react_1.Children.toArray(props.children).some((child) => (0, react_1.isValidElement)(child) &&
        ((!isExternal && child.type === elements_1.LinkPreview) || child.type === elements_1.LinkMenu));
}
//# sourceMappingURL=ExpoLink.js.map