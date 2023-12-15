import * as React from 'react';
import { TextProps, GestureResponderEvent } from 'react-native';
import { Href, resolveHref } from './href';
interface WebAnchorProps {
    /**
     * **Web only:** Specifies where to open the `href`.
     *
     * - **_self**: the current tab.
     * - **_blank**: opens in a new tab or window.
     * - **_parent**: opens in the parent browsing context. If no parent, defaults to **_self**.
     * - **_top**: opens in the highest browsing context ancestor. If no ancestors, defaults to **_self**.
     *
     * This property is passed to the underlying anchor (`<a>`) tag.
     *
     * @default '_self'
     *
     * @example
     * <Link href="https://expo.dev" target="_blank">Go to Expo in new tab</Link>
     */
    target?: '_self' | '_blank' | '_parent' | '_top' | (string & object);
    /**
     * **Web only:** Specifies the relationship between the `href` and the current route.
     *
     * Common values:
     * - **nofollow**: Indicates to search engines that they should not follow the `href`. This is often used for user-generated content or links that should not influence search engine rankings.
     * - **noopener**: Suggests that the `href` should not have access to the opening window's `window.opener` object, which is a security measure to prevent potentially harmful behavior in cases of links that open new tabs or windows.
     * - **noreferrer**: Requests that the browser not send the `Referer` HTTP header when navigating to the `href`. This can enhance user privacy.
     *
     * The `rel` property is primarily used for informational and instructive purposes, helping browsers and web
     * crawlers make better decisions about how to handle and interpret the links on a web page. It is important
     * to use appropriate `rel` values to ensure that links behave as intended and adhere to best practices for web
     * development and SEO (Search Engine Optimization).
     *
     * This property is passed to the underlying anchor (`<a>`) tag.
     *
     * @example
     * <Link href="https://expo.dev" rel="nofollow">Go to Expo</Link>
     */
    rel?: string;
    /**
     * **Web only:** Specifies that the `href` should be downloaded when the user clicks on the link,
     * instead of navigating to it. It is typically used for links that point to files that the user should download,
     * such as PDFs, images, documents, etc.
     *
     * The value of the `download` property, which represents the filename for the downloaded file.
     * This property is passed to the underlying anchor (`<a>`) tag.
     *
     * @example
     * <Link href="/image.jpg" download="my-image.jpg">Download image</Link>
     */
    download?: string;
}
export interface LinkProps extends Omit<TextProps, 'href'>, WebAnchorProps {
    /** Path to route to. */
    href: Href;
    /** Forward props to child component. Useful for custom buttons. */
    asChild?: boolean;
    /** Should replace the current route without adding to the history. */
    replace?: boolean;
    /** Should push the current route, always adding to the history. */
    push?: boolean;
    /** On web, this sets the HTML `class` directly. On native, this can be used with CSS interop tools like Nativewind. */
    className?: string;
    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
}
/** Redirects to the href as soon as the component is mounted. */
export declare function Redirect({ href }: {
    href: Href;
}): null;
export interface LinkComponent {
    (props: React.PropsWithChildren<LinkProps>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: typeof resolveHref;
}
/**
 * Component to render link to another route using a path.
 * Uses an anchor tag on the web.
 *
 * @param props.href Absolute path to route (e.g. `/feeds/hot`).
 * @param props.replace Should replace the current route without adding to the history.
 * @param props.push Should push the current route, always adding to the history.
 * @param props.asChild Forward props to child component. Useful for custom buttons.
 * @param props.children Child elements to render the content.
 * @param props.className On web, this sets the HTML `class` directly. On native, this can be used with CSS interop tools like Nativewind.
 */
export declare const Link: LinkComponent;
export {};
//# sourceMappingURL=Link.d.ts.map