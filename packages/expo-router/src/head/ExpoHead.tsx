import React from 'react';

import { Helmet, HelmetProvider } from '../../vendor/react-helmet-async/lib';
import { useIsFocused } from '../useIsFocused';

function FocusedHelmet({ children }: { children?: React.ReactNode }) {
  return <Helmet>{children}</Helmet>;
}

/**
 * Manages the document head for the current route. On web it sets `<title>` and `<meta>` tags,
 * on iOS it registers an `NSUserActivity` for Handoff and Spotlight, and on Android it is
 * a no-op. Elements are only applied while the route is focused.
 *
 * The default Expo Router entry wraps your app in `Head.Provider` automatically. If you use a
 * custom entry, wrap your app in `Head.Provider` once at the root before using `Head` in a route.
 *
 * @example
 * ```tsx app/index.tsx
 * import Head from 'expo-router/head';
 *
 * export default function Route() {
 *   return (
 *     <Head>
 *       <title>My Page</title>
 *       <meta name="description" content="My page description" />
 *     </Head>
 *   );
 * }
 * ```
 */
export const Head: React.FC<{ children?: React.ReactNode }> & {
  Provider: typeof HelmetProvider;
} = ({ children }: { children?: React.ReactNode }) => {
  const isFocused = useIsFocused();
  if (!isFocused) {
    return null;
  }
  return <FocusedHelmet>{children}</FocusedHelmet>;
};

Head.Provider = HelmetProvider;

export default Head;
