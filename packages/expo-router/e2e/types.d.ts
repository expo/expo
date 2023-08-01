/* eslint-env jest */

declare const process: {
  env: {
    NODE_ENV: string;
    /** Used in `@expo/metro-runtime`. */
    EXPO_DEV_SERVER_ORIGIN?: string;

    FORCE_COLOR?: string;
    CI?: string;
    EXPO_USE_PATH_ALIASES?: string;
    EXPO_USE_STATIC?: string;
    E2E_ROUTER_SRC?: string;
  };
  [key: string]: any;
};
