declare module 'metro-transform-plugins' {
  export function addParamsToDefineCall(code: string, ...params: any[]): string;
}
