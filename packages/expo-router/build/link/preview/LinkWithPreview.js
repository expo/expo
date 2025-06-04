"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLink = CustomLink;
const react_1 = require("react");
const PeekAndPopContext_1 = require("./PeekAndPopContext");
const Preview_1 = require("./Preview");
const hooks_1 = require("./hooks");
const native_1 = require("./native");
const hooks_2 = require("../../hooks");
const Link_1 = require("../Link");
const externalPageRegex = /^(\w+\:)?\/\/.*$/;
const isExternal = (href) => externalPageRegex.test(href);
function CustomLink(props) {
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
    return (<native_1.PeekAndPopView nextScreenKey={nativeTag ?? 0} onWillPreviewOpen={() => {
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
      <native_1.PeekAndPopTriggerView>
        <Link_1.Link {...rest}/>
      </native_1.PeekAndPopTriggerView>
      <native_1.PeekAndPopPreviewView style={{ position: 'absolute' }}>
        {/* TODO: Add a way to make preview smaller then full size */}
        {isGlobalTapped && <Preview_1.Preview key={numberOfTaps} href={rest.href}/>}
      </native_1.PeekAndPopPreviewView>
    </native_1.PeekAndPopView>);
}
//# sourceMappingURL=LinkWithPreview.js.map