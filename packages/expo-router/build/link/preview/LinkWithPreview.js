"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = Link;
const react_1 = require("react");
const PeekAndPopContext_1 = require("./PeekAndPopContext");
const Preview_1 = require("./Preview");
const hooks_1 = require("./hooks");
const hooks_2 = require("../../hooks");
const PeekAndPopNativeComponent_1 = __importDefault(require("../../specs/PeekAndPopNativeComponent"));
const PeekAndPopPreviewNativeComponent_1 = __importDefault(require("../../specs/PeekAndPopPreviewNativeComponent"));
const PeekAndPopTriggerNativeComponent_1 = __importDefault(require("../../specs/PeekAndPopTriggerNativeComponent"));
const Link_1 = require("../Link");
const externalPageRegex = /^(\w+\:)?\/\/.*$/;
const isExternal = (href) => externalPageRegex.test(href);
function Link(props) {
    if (props.preview) {
        if (isExternal(String(props.href))) {
            console.warn('External links previews are not supported');
        }
        if (props.replace) {
            console.warn('Using replace links with preview is not supported');
        }
        else {
            return <LinkWithPreview {...props}/>;
        }
    }
    return <Link_1.Link {...props}/>;
}
function LinkWithPreview({ preview, ...rest }) {
    const router = (0, hooks_2.useRouter)();
    const { setIsGlobalTapped, isGlobalTapped } = (0, PeekAndPopContext_1.usePeekAndPopContext)();
    const [numberOfTaps, setNumberOfTaps] = (0, react_1.useState)(0);
    const [nativeTag, setNativeTag] = (0, react_1.useState)();
    const { preload, getNativeTag } = (0, hooks_1.useScreenPreload)(rest.href);
    // TODO: add a way to add and customize preview actions
    return (<PeekAndPopNativeComponent_1.default nextScreenKey={nativeTag} onWillPreviewOpen={() => {
            preload();
            setIsGlobalTapped(true);
            setNumberOfTaps((prev) => prev + 1);
            // We need to wait here for the screen to preload. This will happen in the next tick
            setTimeout(() => setNativeTag(getNativeTag()));
        }} onPreviewClose={() => {
            setIsGlobalTapped(false);
        }} onPreviewTapped={() => {
            router.navigate(rest.href);
        }}>
      <PeekAndPopTriggerNativeComponent_1.default>
        <Link_1.Link {...rest}/>
      </PeekAndPopTriggerNativeComponent_1.default>
      <PeekAndPopPreviewNativeComponent_1.default style={{ position: 'absolute' }}>
        {/* TODO: Add a way to make preview smaller then full size */}
        {isGlobalTapped && <Preview_1.Preview key={numberOfTaps} href={rest.href}/>}
      </PeekAndPopPreviewNativeComponent_1.default>
    </PeekAndPopNativeComponent_1.default>);
}
//# sourceMappingURL=LinkWithPreview.js.map