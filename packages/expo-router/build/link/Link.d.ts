/// <reference types="../types/expo-router" />
/** Redirects to the href as soon as the component is mounted. */
export declare const Redirect: ExpoRouter.Redirect;
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
export declare const Link: ExpoRouter.LinkComponent;
//# sourceMappingURL=Link.d.ts.map