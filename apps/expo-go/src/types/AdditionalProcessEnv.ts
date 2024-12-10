export {};

declare module 'expo-modules-core' {
  interface ExpoProcessEnv {
    EXPO_PUBLIC_API_URL: string;
  }
}
