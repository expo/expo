// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { useMemo, MouseEvent } from 'react';
import { TextProps, GestureResponderEvent, Platform } from 'react-native';

import { Href } from '../types';

// docsMissing
/**
 * @platform web
 */
export type WebAnchorProps = {
  /**
   * Specifies where to open the [`href`](#href).
   *
   * - **_self**: the current tab.
   * - **_blank**: opens in a new tab or window.
   * - **_parent**: opens in the parent browsing context. If no parent, defaults to **_self**.
   * - **_top**: opens in the highest browsing context ancestor. If no ancestors,
   * defaults to **_self**.
   *
   * This property is passed to the underlying anchor (`<a>`) tag.
   *
   * @default '_self'
   *
   * @example
   * ```jsx
   * <Link href="https://expo.dev" target="_blank">Go to Expo in new tab</Link>
   * ```
   */
  target?: '_self' | '_blank' | '_parent' | '_top' | (string & object);

  /**
   * Specifies the relationship between the [`href`](#href) and the current route.
   *
   * Common values:
   * - **nofollow**: Indicates to search engines that they should not follow the `href`.
   * This is often used for user-generated content or links that should not influence
   * search engine rankings.
   * - **noopener**: Suggests that the `href` should not have access to the opening
   * window's `window.opener` object, which is a security measure to prevent potentially
   * harmful behavior in cases of links that open new tabs or windows.
   * - **noreferrer**: Requests that the browser does not send the `Referer` HTTP header
   * when navigating to the `href`. This can enhance user privacy.
   *
   * The `rel` property is primarily used for informational and instructive purposes, helping browsers and web
   * crawlers make better decisions about how to handle and interpret the links on a web
   * page. It is important to use appropriate `rel` values to ensure that links behave as intended and adhere
   * to best practices for web development and SEO (Search Engine Optimization).
   *
   * This property is passed to the underlying anchor (`<a>`) tag.
   *
   * @example
   * ```jsx
   * <Link href="https://expo.dev" rel="nofollow">Go to Expo</Link>`
   * ```
   */
  rel?: string;

  /**
   * Specifies that the [`href`](#href) should be downloaded when the user clicks on the
   * link, instead of navigating to it. It is typically used for links that point to
   * files that the user should download, such as PDFs, images, documents, and more.
   *
   * The value of the `download` property, which represents the filename for the
   * downloaded file. This property is passed to the underlying anchor (`<a>`) tag.
   *
   * @example
   * ```jsx
   * <Link href="/image.jpg" download="my-image.jpg">Download image</Link>
   * ```
   */
  download?: string;
};

// @docsMissing
/**
 *
 */
export interface LinkProps<T extends string | object>
  extends Omit<TextProps, 'href'>,
    WebAnchorProps {
  /**
   * The path of the route to navigate to. It can either be:
   * - **string**: A full path like `/profile/settings` or a relative path like `../settings`.
   * - **object**: An object with a `pathname` and optional `params`. The `pathname` can be
   * a full path like `/profile/settings` or a relative path like `../settings`. The
   * params can be an object of key-value pairs.
   *
   * @example
   * ```tsx Dynamic
   * import { Link } from 'expo-router';
   * import { View } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *    <Link href="/about">About</Link>
   *    <Link
   *     href={{
   *       pathname: '/user/[id]',
   *       params: { id: 'bacon' }
   *     }}>
   *       View user
   *    </Link>
   *   </View>
   *  );
   *}
   * ```
   */
  href: Href<T>;

  // TODO(EvanBacon): This may need to be extracted for React Native style support.
  /**
   * Used to customize the `Link` component. It will forward all props to the
   * first child of the `Link`. Note that the child component must accept
   * `onPress` or `onClick` props. The `href` and `role` are also
   * passed to the child.
   *
   * @example
   * ```tsx
   * import { Link } from 'expo-router';
   * import { Pressable, Text } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *    <Link href="/home" asChild>
   *      <Pressable>
   *       <Text>Home</Text>
   *      </Pressable>
   *    </Link>
   *   </View>
   *  );
   *}
   * ```
   */
  asChild?: boolean;

  /**
   * Removes the current route from the history and replace it with the
   * specified URL. This is useful for [redirects](/router/reference/redirects/).
   *
   * @example
   *```tsx
   * import { Link } from 'expo-router';
   * import { View } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *     <Link replace href="/feed">Login</Link>
   *   </View>
   *  );
   *}
   * ```
   */
  replace?: boolean;
  /**
   * Always pushes a new route, and never pops or replaces to existing route.
   * You can push the current route multiple times or with new parameters.
   *
   * @example
   *```tsx
   * import { Link } from 'expo-router';
   * import { View } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *     <Link push href="/feed">Login</Link>
   *   </View>
   *  );
   *}
   * ```
   */
  push?: boolean;

  /**
   * On native, this can be used with CSS interop tools like Nativewind.
   * On web, this sets the HTML `class` directly.
   */
  className?: string;

  onPress?: (e: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => void;

  /**
   * Relative URL references are either relative to the directory or the document.
   * By default, relative paths are relative to the document.
   *
   * @see [Resolving relative references in Mozilla's documentation](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references).
   */
  relativeToDirectory?: boolean;

  /**
   * Replaces the initial screen with the current route.
   */
  withAnchor?: boolean;
}

// Mutate the style prop to add the className on web.
export function useInteropClassName(props: { style?: TextProps['style']; className?: string }) {
  if (Platform.OS !== 'web') {
    return props.style;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => {
    if (props.className == null) {
      return props.style;
    }
    const cssStyle = {
      $$css: true,
      __routerLinkClassName: props.className,
    };

    if (Array.isArray(props.style)) {
      return [...props.style, cssStyle];
    }
    return [props.style, cssStyle];
  }, [props.style, props.className]);
}

export const useHrefAttrs = Platform.select<
  (props: Partial<LinkProps<any>>) => { hrefAttrs?: any } & Partial<LinkProps<any>>
>({
  web: function useHrefAttrs({ asChild, rel, target, download }: Partial<LinkProps<any>>) {
    return useMemo(() => {
      const hrefAttrs = {
        rel,
        target,
        download,
      };
      if (asChild) {
        return hrefAttrs;
      }
      return {
        hrefAttrs,
      };
    }, [asChild, rel, target, download]);
  },
  default: function useHrefAttrs() {
    return {};
  },
});
