import { Toast, ToastWrapper } from './Toast';

/**
 * Props passed to a layout's `SuspenseFallback` export and to the component passed as a
 * navigator's `suspenseFallback` prop.
 */
export type SuspenseFallbackProps = {
  /**
   * The route module's `contextKey`.
   *
   * @example
   * `./index.tsx`
   * `./profile/[id].tsx`
   */
  route: string;
  /**
   * The route's URL parameters.
   *
   * @example
   * ```
   * { id: "123" } // For a route `./profile/[id].tsx` navigated to as `/profile/123`
   * ```
   *
   */
  params: Record<string, string | string[]>;
};

/**
 * The built-in fallback rendered while a route loads or suspends when no custom fallback is
 * configured. Shows a bundling toast in development and renders nothing in production.
 */
export function SuspenseFallback({ route }: SuspenseFallbackProps) {
  if (__DEV__) {
    return (
      <ToastWrapper>
        <Toast filename={route}>Bundling...</Toast>
      </ToastWrapper>
    );
  }
  return null;
}
