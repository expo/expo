/**
 * NOTE(brentvatne):
 * AppLoadingPlaceholder exists to smooth the upgrade experience to SDK 40. The
 * placeholder behaves mostly as expected with the existing API, however it
 * will no longer leverage any native APIs to keep the splash screen visible.
 * This makes it so a user who upgrades and runs their app can see their app
 * running and get the warning about the AppLoading module being removed
 * top, without an extraneous red screen that would appear from attempting to
 * render an undefined AppLoading component.
 *
 * Remove this in SDK 42.
 */

import React from 'react';

type Props =
  | {
      /**
       * Optional, you can do this process manually if you prefer.
       * This is mainly for backwards compatibility and it is not recommended.
       *
       * When provided, requires providing `onError` prop as well.
       * @deprecated
       */
      startAsync: () => Promise<void>;

      /**
       * If `startAsync` throws an error, it is caught and passed into the provided function.
       * @deprecated
       */
      onError: (error: Error) => void;

      /**
       * Called when `startAsync` resolves or rejects.
       * This should be used to set state and unmount the `AppLoading` component.
       * @deprecated
       */
      onFinish: () => void;

      /**
       * Whether to hide the native splash screen as soon as you unmount the `AppLoading` component.
       * Auto-hiding is enabled by default.
       */
      autoHideSplash?: boolean;
    }
  | {
      /**
       * Whether to hide the native splash screen as soon as you unmount the `AppLoading` component.
       * Auto-hiding is enabled by default.
       */
      autoHideSplash?: boolean;
    };

export default class AppLoadingPlaceholder extends React.Component<Props> {
  _isMounted: boolean = false;

  componentDidMount() {
    this._isMounted = true;

    this.startLoadingAppResourcesAsync().catch((error) => {
      console.error(`AppLoading threw an unexpected error when loading:\n${error.stack}`);
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  private async startLoadingAppResourcesAsync() {
    if (!('startAsync' in this.props)) {
      return;
    }

    if (!('onFinish' in this.props)) {
      throw new Error('AppLoading onFinish prop is required if startAsync is provided');
    }

    if (!('onError' in this.props)) {
      throw new Error('AppLoading onError prop is required if startAsync is provided');
    }

    try {
      await this.props.startAsync();
    } catch (e) {
      if (!this._isMounted) {
        return;
      }
      this.props.onError(e);
    } finally {
      if (!this._isMounted) {
        return;
      }
      // If we get to this point then we know that either there was no error, or the error was handled.
      this.props.onFinish();
    }
  }

  render() {
    return null;
  }
}
