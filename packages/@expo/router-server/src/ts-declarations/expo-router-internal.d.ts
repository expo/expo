declare module 'expo-router/_ctx-shared' {
  export const EXPO_ROUTER_CTX_IGNORE: RegExp;
}

declare module 'expo-router/_ctx-html' {
  export const ctx: ReturnType<typeof require.context>;
}

declare module 'expo-router/_async-server-import' {
  export function asyncServerImport(moduleId: string): Promise<any>;
}
