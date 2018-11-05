import { EventEmitter } from 'fbemitter';
import React from 'react';

import NativeAppLoading from './AppLoadingNativeWrapper';

type Props =
  | {
      startAsync: () => Promise<void>;
      onError?: (error: Error) => void;
      onFinish?: () => void;
      autoHideSplash?: boolean;
    }
  | {
      startAsync: null;
      onError: null;
      onFinish: null;
    };

export default class AppLoading extends React.Component<Props> {
  _isMounted: boolean = false;

  componentDidMount() {
    this._isMounted = true;
    _emitEvent('componentDidMount');

    // startAsync is optional, you can do this process manually if you prefer (this is mainly for
    // backwards compatibility and it is not recommended)
    if (this.props.startAsync) {
      this._startLoadingAppResourcesAsync().catch(error => {
        console.error(`AppLoading threw an unexpected error when loading:\n${error.stack}`);
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    _emitEvent('componentWillUnmount');
  }

  _startLoadingAppResourcesAsync = async () => {
    if (!this.props.onFinish) {
      throw new Error('AppLoading onFinish prop is required if startAsync is provided');
    }

    try {
      await this.props.startAsync!();
    } catch (e) {
      if (!this._isMounted) return;

      if (this.props.onError) {
        this.props.onError(e);
      } else {
        throw e;
      }
    } finally {
      if (!this._isMounted) return;

      // If we get to this point then we know that either there was no error, or the error was
      // handled.
      if (this.props.onFinish) {
        this.props.onFinish();
      }
    }
  };

  render() {
    return <NativeAppLoading {...this.props} />;
  }
}

let _lifecycleEmitter: EventEmitter | null = null;

function _emitEvent(event: string): void {
  if (_lifecycleEmitter) {
    _lifecycleEmitter.emit(event);
  }
}

export function getAppLoadingLifecycleEmitter(): EventEmitter {
  if (!_lifecycleEmitter) {
    _lifecycleEmitter = new EventEmitter();
  }
  return _lifecycleEmitter;
}
