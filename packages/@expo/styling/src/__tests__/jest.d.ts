/// <reference types="@types/jest" />
export {};
declare global {
  namespace jest {
    interface Matchers<R> {
      styleToEqual(style?: Record<string, unknown> | Record<string, unknown>[]): R;
      toHaveAnimatedStyle(style?: Record<string, unknown> | Record<string, unknown>[]): R;
    }
  }
}
