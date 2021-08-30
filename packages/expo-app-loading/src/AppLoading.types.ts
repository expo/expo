// @needsAudit
/**
 * The following props are recommended, but optional. If you do not provide any props, you are
 * responsible for coordinating loading assets, handling errors, and updating state to unmount
 * the `AppLoading` component.
 */
export type AppLoadingProps =
  | {
      /**
       * A function that returns a `Promise`, and the `Promise` should fulfil when the app is done
       * loading required data and assets. You can do this process manually if you prefer.
       * This is mainly for backwards compatibility and it is not recommended.
       *
       * When provided, requires providing `onError` prop as well.
       * @deprecated
       */
      startAsync: () => Promise<void>;

      /**
       * If `startAsync` throws an error, it is caught and passed into the function provided to `onError`.
       * @deprecated
       */
      onError: (error: Error) => void;

      /**
       * __(Required if you provide startAsync).__ Called when `startAsync` resolves or rejects.
       * This should be used to set state and unmount the `AppLoading` component.
       * @deprecated
       */
      onFinish: () => void;

      /**
       * Whether to hide the native splash screen as soon as you unmount the `AppLoading` component.
       * Auto-hiding is enabled by default. See [SplashScreen](../splash-screen) module for an example.
       */
      autoHideSplash?: boolean;
    }
  | {
      /**
       * Whether to hide the native splash screen as soon as you unmount the `AppLoading` component.
       * Auto-hiding is enabled by default. See [SplashScreen](../splash-screen) module for an example.
       */
      autoHideSplash?: boolean;
    };
