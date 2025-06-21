"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoLink = ExpoLink;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_1 = require("react");
const BaseExpoRouterLink_1 = require("./BaseExpoRouterLink");
const LinkWithPreview_1 = require("./LinkWithPreview");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
function ExpoLink(props) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    if (isLinkWithPreview(props) && !isPreview && expo_constants_1.default?.expoConfig?.newArchEnabled !== false) {
        return <LinkWithPreview_1.LinkWithPreview {...props}/>;
    }
    return <BaseExpoRouterLink_1.BaseExpoRouterLink {...props}/>;
}
function isLinkWithPreview(props) {
    return react_1.Children.toArray(props.children).some((child) => (0, react_1.isValidElement)(child) && child.type === LinkWithPreview_1.LinkPreview);
}
//# sourceMappingURL=ExpoLink.js.map