"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLink = CustomLink;
const react_1 = require("react");
const LinkPreviewContext_1 = require("./LinkPreviewContext");
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
        else if (props.replace) {
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
    const { setIsPreviewOpen } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
    const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = (0, react_1.useState)(false);
    const [nativeTag, setNativeTag] = (0, react_1.useState)();
    const { preload, getNativeTag, isValid } = (0, hooks_1.useScreenPreload)(rest.href);
    if (!isValid) {
        console.warn(`Preview link is not within react-native-screens stack. The preview will not work [${rest.href}]`);
        return <Link_1.Link {...rest}/>;
    }
    // TODO: add a way to add and customize preview actions
    return (<native_1.PeekAndPopView nextScreenKey={nativeTag ?? 0} onWillPreviewOpen={() => {
            preload();
            setIsPreviewOpen(true);
            setIsCurrenPreviewOpen(true);
            // We need to wait here for the screen to preload. This will happen in the next tick
            setTimeout(() => setNativeTag(getNativeTag()));
        }} onPreviewWillClose={() => { }} onPreviewDidClose={() => {
            setIsPreviewOpen(false);
            setIsCurrenPreviewOpen(false);
        }} onPreviewTapped={() => {
            router.navigate(rest.href);
        }}>
      <native_1.PeekAndPopTriggerView>
        <Link_1.Link {...rest}/>
      </native_1.PeekAndPopTriggerView>
      <native_1.PeekAndPopPreviewView style={{ position: 'absolute' }}>
        {/* TODO: Add a way to make preview smaller then full size */}
        {isCurrentPreviewOpen && <Preview_1.Preview href={rest.href}/>}
      </native_1.PeekAndPopPreviewView>
    </native_1.PeekAndPopView>);
}
//# sourceMappingURL=LinkWithPreview.js.map