declare const process: {
  env: {
    NODE_ENV: string;
    /** Used in `@expo/metro-runtime`. */
    EXPO_DEV_SERVER_ORIGIN?: string;
  };
  [key: string]: any;
};
