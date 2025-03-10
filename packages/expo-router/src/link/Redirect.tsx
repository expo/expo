import { useContext } from 'react';

import { WithAnchorOptions } from '../global-state/routing';
import { useRouter } from '../hooks';
import { Href } from '../types';
import { useFocusEffect } from '../useFocusEffect';
import { IsLayoutContext } from '../useScreens';
import { Slot } from '../views/Navigator';

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
   * Can only when used with the `push`/`navigate`/`dismissTo` prop.
   */
  withAnchor?: WithAnchorOptions;
  /**
   * Always pushes a new route, and never pops or replaces to existing route.
   * You can push the current route multiple times or with new parameters.
   *
   * @example
   *```tsx
   * import { Redirect } from 'expo-router';
   * import { View } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *     <Redirect navigate href="/feed">Login</Redirect>
   *   </View>
   *  );
   *}
   * ```
   */
  navigate?: boolean;
  /**
   * Always pushes a new route, and never pops or replaces to existing route.
   * You can push the current route multiple times or with new parameters.
   *
   * @example
   *```tsx
   * import { Redirect } from 'expo-router';
   * import { View } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *     <Redirect push href="/feed">Login</Redirect>
   *   </View>
   *  );
   *}
   * ```
   */
  push?: boolean;
  /**
   * While in a stack, this will dismiss screens until the provided href is reached. If the href is not found,
   * it will instead replace the current screen with the provided href.
   *
   * @example
   *```tsx
   * import { Redirect } from 'expo-router';
   * import { View } from 'react-native';
   *
   * export default function Route() {
   *  return (
   *   <View>
   *     <Redirect dismissTo href="/feed">Close modal</Redirect>
   *   </View>
   *  );
   *}
   * ```
   */
  dismissTo?: boolean;
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
export function Redirect({
  href,
  push,
  dismissTo,
  navigate,
  relativeToDirectory,
  withAnchor,
}: RedirectProps) {
  const router = useRouter();

  const event: keyof typeof router = push
    ? 'push'
    : dismissTo
      ? 'dismissTo'
      : navigate
        ? 'navigate'
        : 'replace';

  useFocusEffect(() => {
    try {
      router[event](href, { relativeToDirectory, withAnchor });
    } catch (error) {
      console.error(error);
    }
  });

  return useContext(IsLayoutContext) ? <Slot /> : null;
}
