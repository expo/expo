export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePathname(pathname: string): R;
      toHaveSearchParams(params: Record<string, string>): R;
    }
  }
}
