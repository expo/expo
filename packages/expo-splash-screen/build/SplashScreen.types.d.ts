export type SplashScreenOptions = {
    /**
     * The duration of the fade out animation in milliseconds.
     * @default 2000
     */
    duration?: number;
};
export type SplashScreenNativeModule = {
    setOptions: (options: SplashScreenOptions) => void;
    preventAutoHideAsync: () => Promise<boolean>;
    hide: () => void;
    hideAsync: () => Promise<void>;
};
//# sourceMappingURL=SplashScreen.types.d.ts.map