import * as Fiber from '@daniel-nagy/transporter/build/Fiber';
import * as Json from '@daniel-nagy/transporter/build/Json';
import * as Message from '@daniel-nagy/transporter/build/Message';
import * as Observable from '@daniel-nagy/transporter/build/Observable';
import * as Session from '@daniel-nagy/transporter/build/Session';
import * as SuperJson from '@daniel-nagy/transporter/build/SuperJson';
import React from 'react';

import type { Api } from './api';
import { protocol } from './protocol';

type ReactNativeWebView = {
  postMessage(message: string): void;
};

declare const window: Window & {
  ReactNativeWebView: ReactNativeWebView;
};

/**
 * Returns a client that can communicate with the native app using
 * React Native WebView as a transport layer.
 */
export function useClient<Props extends Record<string, unknown>>() {
  const session = React.useMemo(() => {
    const resource = Session.Resource<Api<Props>>();
    const session = Session.client({ protocol, resource });

    session.output
      .pipe(Observable.map(SuperJson.toJson), Observable.map(JSON.stringify))
      .subscribe((message) => window.ReactNativeWebView.postMessage(message));

    const eventListener = Observable.fromEvent<MessageEvent>(window, 'message')
      .pipe(
        Observable.map((event) => safeParse(event.data)),
        Observable.map(SuperJson.fromJson),
        Observable.filter((message) => Message.isMessage(message))
      )
      .subscribe((message) => session.input.next(message));

    session.stateChange.subscribe((state) => {
      switch (state) {
        case Fiber.State.Terminated:
          eventListener.unsubscribe();
      }
    });

    return session;
  }, []);

  const client = React.useMemo(() => session.createProxy(), [session]);

  React.useEffect(() => {
    return () => session.terminate();
  }, [session]);

  return client;
}

function safeParse(message: string): Json.t {
  try {
    return JSON.parse(message);
  } catch (_error) {
    return null;
  }
}
