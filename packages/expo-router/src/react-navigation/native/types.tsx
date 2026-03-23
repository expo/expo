import type {
  getActionFromState as getActionFromStateDefault,
  getPathFromState as getPathFromStateDefault,
  getStateFromPath as getStateFromPathDefault,
  PathConfigMap,
  Route,
} from '@react-navigation/core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface Theme extends NativeTheme {}
  }
}

type FontStyle = {
  fontFamily: string;
  fontWeight:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
};

interface NativeTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
  fonts: {
    regular: FontStyle;
    medium: FontStyle;
    bold: FontStyle;
    heavy: FontStyle;
  };
}

export type Theme = NativeTheme;

export type LocaleDirection = 'ltr' | 'rtl';

export type LinkingOptions<ParamList extends {}> = {
  /**
   * Whether deep link handling should be enabled.
   * Defaults to true.
   */
  enabled?: boolean;
  /**
   * The prefixes are stripped from the URL before parsing them.
   * Usually they are the `scheme` + `host` (e.g. `myapp://chat?user=jane`)
   *
   * This is not supported on Web.
   *
   * @example
   * ```js
   * {
   *    prefixes: [
   *      "myapp://", // App-specific scheme
   *      "https://example.com", // Prefix for universal links
   *      "https://*.example.com" // Prefix which matches any subdomain
   *    ]
   * }
   * ```
   */
  prefixes: string[];
  /**
   * Optional function which takes an incoming URL returns a boolean
   * indicating whether React Navigation should handle it.
   *
   * This can be used to disable deep linking for specific URLs.
   * e.g. URLs used for authentication, and not for deep linking to screens.
   *
   * This is not supported on Web.
   *
   * @example
   * ```js
   * {
   *   // Filter out URLs used by expo-auth-session
   *   filter: (url) => !url.includes('+expo-auth-session')
   * }
   * ```
   */
  filter?: (url: string) => boolean;
  /**
   * Config to fine-tune how to parse the path.
   *
   * @example
   * ```js
   * {
   *   Chat: {
   *     path: 'chat/:author/:id',
   *     parse: { id: Number }
   *   }
   * }
   * ```
   */
  config?: {
    /**
     * Path string to match against for the whole navigation tree.
     * It's not possible to specify params here since this doesn't belong to a screen.
     * This is useful when the whole app is under a specific path.
     * e.g. all of the screens are under `/admin` in `https://example.com/admin`
     */
    path?: string;
    /**
     * Path configuration for child screens.
     */
    screens: PathConfigMap<ParamList>;
    /**
     * Name of the initial route to use for the root navigator.
     */
    initialRouteName?: keyof ParamList;
  };
  /**
   * Custom function to get the initial URL used for linking.
   * Uses `Linking.getInitialURL()` by default.
   *
   * This is not supported on Web.
   *
   * @example
   * ```js
   * {
   *    getInitialURL () => Linking.getInitialURL(),
   * }
   * ```
   */
  getInitialURL?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  /**
   * Custom function to get subscribe to URL updates.
   * Uses `Linking.addEventListener('url', callback)` by default.
   *
   * This is not supported on Web.
   *
   * @example
   * ```js
   * {
   *    subscribe: (listener) => {
   *      const onReceiveURL = ({ url }) => listener(url);
   *
   *      Linking.addEventListener('url', onReceiveURL);
   *
   *      return () => Linking.removeEventListener('url', onReceiveURL);
   *   }
   * }
   * ```
   */
  subscribe?: (
    listener: (url: string) => void
  ) => undefined | void | (() => void);
  /**
   * Custom function to parse the URL to a valid navigation state (advanced).
   */
  getStateFromPath?: typeof getStateFromPathDefault;
  /**
   * Custom function to convert the state object to a valid URL (advanced).
   * Only applicable on Web.
   */
  getPathFromState?: typeof getPathFromStateDefault;
  /**
   * Custom function to convert the state object to a valid action (advanced).
   */
  getActionFromState?: typeof getActionFromStateDefault;
};

export type DocumentTitleOptions = {
  enabled?: boolean;
  formatter?: (
    options: Record<string, any> | undefined,
    route: Route<string> | undefined
  ) => string;
};

export type ServerContainerRef = {
  getCurrentOptions(): Record<string, any> | undefined;
};
