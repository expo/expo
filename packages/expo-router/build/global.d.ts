declare module 'expo-modules-core' {
    namespace ExpoGlobal {
        let router: {
            /**
             * Experimental API to listen for navigation events in Expo Router.
             *
             * @experimental
             */
            get navigationEvents(): {
                enable: () => void;
                saveCurrentPathname: () => void;
            };
            /**
             * Experimental API to get the current pathname in Expo Router.
             *
             * @experimental
             */
            get currentPathname(): string | undefined;
            /**
             * Experimental API to get the current route params in Expo Router.
             *
             * @experimental
             */
            get currentParams(): Record<string, string> | undefined;
        };
    }
}
export {};
//# sourceMappingURL=global.d.ts.map