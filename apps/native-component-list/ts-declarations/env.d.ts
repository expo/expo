declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TEST: string;
    }
  }
}

export {};
