import './crypto';
import * as BehaviorSubject from '@daniel-nagy/transporter/build/BehaviorSubject';
import * as Message from '@daniel-nagy/transporter/build/Message';
import * as PubSub from '@daniel-nagy/transporter/build/PubSub';
import * as Session from '@daniel-nagy/transporter/build/Session';
import * as SuperJson from '@daniel-nagy/transporter/build/SuperJson';
import React from 'react';
import type { WebView } from 'react-native-webview';

import type { Api } from './api';
import { protocol } from './protocol';
import type { Context } from './web-context';

/**
 * Creates a server session that the web app can connect to using React Native
 * WebView as a transport layer.
 */
export function useServer<Props extends Record<string, unknown>>({
  context: nativeContext,
  props: nativeProps,
  webView,
}: {
  context: Context;
  props: Props;
  webView: WebView | null;
}) {
  const props = React.useMemo(() => BehaviorSubject.of(nativeProps), []);
  const context = React.useMemo(() => BehaviorSubject.of(nativeContext), []);
  const [session, setSession] = React.useState<Session.t | null>(null);

  const onMessage = React.useCallback(
    (data: string) => {
      const message = SuperJson.fromJson(safeParse(data));
      if (Message.isMessage(message)) session?.input.next(message);
    },
    [session]
  );

  React.useEffect(() => props.next(nativeProps), toArray(nativeProps));
  React.useEffect(() => context.next(nativeContext), [nativeContext]);

  React.useEffect(() => {
    if (!webView) return;

    const session = Session.server({
      protocol,
      provide: {
        context: PubSub.from(context),
        props: PubSub.from(props),
      } satisfies Api<Props>,
    });

    session.output.subscribe((message) => {
      webView.postMessage(JSON.stringify(SuperJson.toJson(message)));
    });

    setSession(session);

    return () => session.terminate();
  }, [context, props, webView]);

  return onMessage;
}

function toArray(props: Record<string, unknown>): unknown[] {
  return Object.entries(props)
    .sort(([left], [right]) => stringCompare(left, right))
    .map(([, value]) => value);
}

function safeParse(message: string) {
  try {
    return JSON.parse(message);
  } catch (_error) {
    return null;
  }
}

function stringCompare(left: string, right: string) {
  switch (true) {
    case left > right:
      return 1;
    case left < right:
      return -1;
    default:
      return 0;
  }
}
