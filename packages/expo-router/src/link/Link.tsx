'use client';
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { PropsWithChildren, useMemo, MouseEvent, JSX, useState, useEffect } from 'react';
import { Text, GestureResponderEvent, Platform } from 'react-native';

import { resolveHref } from './href';
import useLinkToPathProps from './useLinkToPathProps';
import { useRouter } from '../hooks';
import { Href } from '../types';
import { useFocusEffect } from '../useFocusEffect';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import { useInteropClassName, useHrefAttrs, LinkProps, WebAnchorProps } from './useLinkHooks';
import { Prefetch } from '../Prefetch';
import { Slot } from '../ui/Slot';
import { Preview } from './preview/Preview';
import { useScreenPreload } from './preview/hooks';
import { PeekAndPopPreviewView, PeekAndPopTriggerView, PeekAndPopView } from './preview/native';

export interface LinkComponent {
  (props: PropsWithChildren<LinkProps>): JSX.Element;
  /** Helper method to resolve an Href object into a string. */
  resolveHref: (href: Href) => string;
}

export type RedirectProps = {
  /**
   * The path of the route to navigate to. It can either be:
   * - **string**: A full path like `/profile/settings` or a relative path like `../settings`.
   * - **object**: An object with a `pathname` and optional `params`. The `pathname` can be
   * a full path like `/profile/settings` or a relative path like `../settings`. The
   * params can be an object of key-value pairs.
   *
   * @example
   * ```tsx Dynamic
   * import { Redirect } from 'expo-router';
   *
   * export default function RedirectToAbout() {
   *  return (
   *    <Redirect href="/about">About</Link>
   *  );
   *}
   * ```
   */
  href: Href;

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
};

/**
 * Redirects to the `href` as soon as the component is mounted.
 *
 * @example
 * ```tsx
 * import { View, Text } from 'react-native';
 * import { Redirect } from 'expo-router';
 *
 * export default function Page() {
 *  const { user } = useAuth();
 *
 *  if (!user) {
 *    return <Redirect href="/login" />;
 *  }
 *
 *  return (
 *    <View>
 *      <Text>Welcome Back!</Text>
 *    </View>
 *  );
 * }
 * ```
 */
export function Redirect({ href, relativeToDirectory, withAnchor }: RedirectProps) {
  const router = useRouter();
  useFocusEffect(() => {
    try {
      router.replace(href, { relativeToDirectory, withAnchor });
    } catch (error) {
      console.error(error);
    }
  });
  return null;
}

/**
 * Component that renders a link using [`href`](#href) to another route.
 * By default, it accepts children and wraps them in a `<Text>` component.
 *
 * Uses an anchor tag (`<a>`) on web and performs a client-side navigation to preserve
 * the state of the website and navigate faster. The web-only attributes such as `target`,
 * `rel`, and `download` are supported and passed to the anchor tag on web. See
 * [`WebAnchorProps`](#webanchorprops) for more details.
 *
 * > **Note**: Client-side navigation works with both single-page apps,
 * and [static-rendering](/router/reference/static-rendering/).
 *
 * @example
 * ```tsx
 * import { Link } from 'expo-router';
 * import { View } from 'react-native';
 *
 * export default function Route() {
 *  return (
 *   <View>
 *    <Link href="/about">About</Link>
 *   </View>
 *  );
 *}
 * ```
 */

export function Link(props: LinkProps) {
  if (props.experimentalPreview) {
    return <LinkWithPreview {...props} />;
  }
  return <ExpoRouterLink {...props} />;
}

Link.resolveHref = resolveHref;

function ExpoRouterLink({
  href,
  replace,
  push,
  dismissTo,
  // TODO: This does not prevent default on the anchor tag.
  relativeToDirectory,
  asChild,
  rel,
  target,
  download,
  withAnchor,
  dangerouslySingular: singular,
  prefetch,
  ...rest
}: LinkProps) {
  // Mutate the style prop to add the className on web.
  const style = useInteropClassName(rest);

  // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
  const hrefAttrs = useHrefAttrs({ asChild, rel, target, download });

  const resolvedHref = useMemo(() => {
    if (href == null) {
      throw new Error('Link: href is required');
    }
    return resolveHref(href);
  }, [href]);

  let event;
  if (push) event = 'PUSH';
  if (replace) event = 'REPLACE';
  if (dismissTo) event = 'POP_TO';

  const props = useLinkToPathProps({
    href: resolvedHref,
    event,
    relativeToDirectory,
    withAnchor,
    dangerouslySingular: singular,
  });

  const onPress = (e: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => {
    if ('onPress' in rest) {
      rest.onPress?.(e);
    }
    props.onPress(e);
  };

  const Component = asChild ? Slot : Text;

  // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
  const element = (
    <Component
      {...props}
      {...hrefAttrs}
      {...rest}
      style={style}
      {...Platform.select({
        web: {
          onClick: onPress,
        } as any,
        default: { onPress },
      })}
    />
  );

  return prefetch ? (
    <>
      <Prefetch href={href} />
      {element}
    </>
  ) : (
    element
  );
}

const externalPageRegex = /^(\w+:)?\/\/.*$/;
const isExternal = (href: string) => externalPageRegex.test(href);

export function LinkWithPreview({ experimentalPreview, ...rest }: LinkProps) {
  const router = useRouter();
  const { setIsPreviewOpen } = useLinkPreviewContext();
  const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | undefined>(
    undefined
  );

  const { preload, updateNavigationKey, navigationKey } = useScreenPreload(rest.href);

  useEffect(() => {
    if (isExternal(String(rest.href))) {
      console.warn('External links previews are not supported');
    }
    if (rest.replace) {
      console.warn('Using replace links with preview is not supported');
    }
  }, [rest.href, rest.replace]);

  console.log(rest);

  if (isExternal(String(rest.href)) || rest.replace) {
    return <ExpoRouterLink {...rest} />;
  }

  console.log('previewSize', previewSize);

  // TODO: add a way to add and customize preview actions
  return (
    <PeekAndPopView
      nextScreenId={navigationKey}
      onWillPreviewOpen={() => {
        preload();
        setIsPreviewOpen(true);
        setIsCurrenPreviewOpen(true);
        // We need to wait here for the screen to preload. This will happen in the next tick
        setTimeout(updateNavigationKey);
      }}
      onPreviewWillClose={() => {}}
      onPreviewDidClose={() => {
        setIsPreviewOpen(false);
        setIsCurrenPreviewOpen(false);
      }}
      onPreviewTapped={() => {
        router.navigate(rest.href, { __internal__PeekAndPopKey: navigationKey });
      }}>
      <PeekAndPopTriggerView>
        <ExpoRouterLink {...rest} ref={rest.ref} />
      </PeekAndPopTriggerView>
      <PeekAndPopPreviewView
        onSetSize={({ nativeEvent: size }) => setPreviewSize(size)}
        style={{ position: 'absolute', ...previewSize }}>
        {/* TODO: Add a way to make preview smaller then full size */}
        {isCurrentPreviewOpen && <Preview href={rest.href} />}
      </PeekAndPopPreviewView>
    </PeekAndPopView>
  );
}

export { LinkProps, WebAnchorProps };
