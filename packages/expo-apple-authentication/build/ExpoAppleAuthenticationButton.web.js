import React, { useEffect } from 'react';
import { AppleAuthenticationButtonStyle, AppleAuthenticationButtonType, } from './AppleAuthentication.types';
const config = {
    'client-id': '[CLIENT_ID]',
    scope: '[SCOPES]',
    'redirect-uri': '[REDIRECT_URI]',
    state: '[STATE]',
    nonce: '[NONCE]',
    'use-popup': true,
};
function load() {
    const metaTags = [];
    Object.entries(config).forEach(([key, value]) => {
        const metaTag = document.createElement('meta');
        metaTag.setAttribute(`name`, `appleid-signin-${key}`);
        metaTag.setAttribute(`content`, value.toString());
        document.head.appendChild(metaTag);
        metaTags.push(metaTag);
    });
    return () => {
        metaTags.forEach((tag) => document.head.removeChild(tag));
    };
}
function ExpoAppleAuthenticationButton(props) {
    const buttonProps = {
        [AppleAuthenticationButtonStyle.BLACK]: { 'data-color': 'black', 'data-border': false },
        [AppleAuthenticationButtonStyle.WHITE]: { 'data-color': 'white', 'data-border': false },
        [AppleAuthenticationButtonStyle.WHITE_OUTLINE]: { 'data-color': 'white', 'data-border': true },
    }[props.buttonStyle];
    const buttonType = {
        [AppleAuthenticationButtonType.CONTINUE]: 'continue',
        [AppleAuthenticationButtonType.SIGN_IN]: 'sign-in',
        [AppleAuthenticationButtonType.SIGN_UP]: 'sign-up',
    }[props.buttonType];
    useEffect(() => {
        return load();
    }, []);
    useEffect(() => {
        const scriptTag = document.createElement('script');
        scriptTag.src =
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        scriptTag.type = 'text/javascript';
        document.head.appendChild(scriptTag);
        return () => {
            document.head.removeChild(scriptTag);
        };
    }, [props.buttonStyle, buttonType]);
    return (React.createElement("div", { key: `${props.buttonStyle}`, 
        // @ts-ignore
        style: props.style, id: "appleid-signin", ...buttonProps, "data-type": buttonType }));
}
export default ExpoAppleAuthenticationButton;
//# sourceMappingURL=ExpoAppleAuthenticationButton.web.js.map