import ExceptionsManager from './error-overlay/modules/ExceptionsManager';

type GlobalThis = {
  HermesInternal:
    | {
        enablePromiseRejectionTracker?: (options: {
          allRejections?: boolean;
          onUnhandled?: (id: number, rejection?: any) => void;
          onHandled?: (id: number) => void;
        }) => void;
        hasPromise?: () => boolean;
      }
    | undefined;
};

// https://github.com/facebook/react-native/commit/c4082c9ce208a324c2d011823ca2ba432411aafc
export function enablePromiseRejectionTracking() {
  const global = globalThis as unknown as GlobalThis;
  if (
    // Early return if Hermes Promise is not available or tracker is not available
    // https://github.com/facebook/react-native/blob/256565cb1198c02cda218e06de5700c85d8ad589/packages/react-native/Libraries/Core/polyfillPromise.js#L25
    !global?.HermesInternal?.hasPromise?.() ||
    !global?.HermesInternal?.enablePromiseRejectionTracker
  ) {
    return;
  }

  global.HermesInternal.enablePromiseRejectionTracker({
    allRejections: true,
    onUnhandled: (id, rejection) => {
      let message: string;

      if (rejection === undefined) {
        message = '';
      } else if (
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        Object.prototype.toString.call(rejection) === '[object Error]'
      ) {
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        message = Error.prototype.toString.call(rejection);
      } else {
        try {
          message = require('pretty-format').format(rejection);
        } catch {
          message = typeof rejection === 'string' ? rejection : JSON.stringify(rejection);
        }
      }

      const rejectionPrefix = `Uncaught (in promise, id: ${id})`;
      // This is not an Expo error, but
      // an uncaught promise rejection in the app.
      const rejectionError = new Error(`${rejectionPrefix} ${message ?? ''}`, {
        cause: rejection,
      });
      if (typeof rejection === 'object' && 'stack' in rejection) {
        // If original rejection stack exists, use it
        rejectionError.stack = `${rejectionPrefix} ${rejection.stack ?? ''}`;
      } else {
        // Deleting the stack property would trigger exception handler to collect the current stack
        // Stack of the error created here won't be any useful to the user
        rejectionError.stack = `${rejectionPrefix} ${message ?? ''}`;
      }
      ExceptionsManager.handleException(rejectionError);
    },
    onHandled: (id) => {
      const warning =
        `Promise rejection handled (id: ${id})\n` +
        'This means you can ignore any previous messages of the form ' +
        `"Uncaught (in promise, id: ${id})"`;
      console.warn(warning);
    },
  });
}
