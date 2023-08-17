declare const process: {
  env: {
    NODE_ENV: string;
    /** Used in `@expo/metro-runtime`. */
    EXPO_DEV_SERVER_ORIGIN?: string;
    /** Enables static rendering entry point on web. */
    EXPO_PUBLIC_USE_STATIC?: string;

    EXPO_ROUTER_IMPORT_MODE_ANDROID?: string;
    EXPO_ROUTER_IMPORT_MODE_IOS?: string;
    EXPO_ROUTER_IMPORT_MODE_WEB?: string;
    EXPO_ROUTER_ABS_APP_ROOT?: string;
    EXPO_ROUTER_APP_ROOT?: string;
  };
  [key: string]: any;
};
