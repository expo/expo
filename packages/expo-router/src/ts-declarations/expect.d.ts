declare module 'expect/build/matchers' {
  const matchers: any;
  export default matchers;
}

declare namespace jest {
  interface Matchers<R, T = unknown> {
    toHavePathname(pathname: string): R;
    toHavePathnameWithParams(pathname: string): R;
    toHaveSegments(segments: string[]): R;
    toHaveSearchParams(params: Record<string, string | string[]>): R;
    toHaveRouterState(state: Record<string, unknown> | undefined): R;
  }
}
