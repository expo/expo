/**
 * A stack based component for keeping the splash screen visible.
 * Useful for stacked requests that need to be completed before the app is ready.
 * After all instances have been unmounted, the splash screen will be hidden.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [isLoading, setIsLoading] = React.useState(true);
 *
 *   if (isLoading) {
 *     return <SplashScreen />
 *   }
 *
 *   return <Text>Ready!</Text>
 * }
 * ```
 */
export declare function SplashScreen(): null;
export declare namespace SplashScreen {
    var hideAsync: () => void;
    var preventAutoHideAsync: () => void;
    var _pushEntry: () => any;
    var _popEntry: (entry: string) => void;
}
export declare const _internal_preventAutoHideAsync: () => void;
export declare const _internal_maybeHideAsync: () => void;
//# sourceMappingURL=Splash.d.ts.map