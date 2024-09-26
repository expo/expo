declare const process: {
  env: {
    NODE_ENV: string;
    /** Used in `@expo/metro-runtime`. */
    EXPO_DEV_SERVER_ORIGIN?: string;

    EXPO_ROUTER_IMPORT_MODE?: string;
    EXPO_ROUTER_ABS_APP_ROOT?: string;
    EXPO_ROUTER_APP_ROOT?: string;

    /** Maps to the `experiments.baseUrl` property in the project Expo config. This is injected by `babel-preset-expo` and supports automatic cache invalidation. */
    EXPO_BASE_URL?: string;

    /** Build-time representation of the `Platform.OS` value that the current JavaScript was bundled for. Does not support platform shaking wrapped require statements. */
    EXPO_OS?: string;
  };
  [key: string]: any;
};
