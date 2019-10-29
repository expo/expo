import * as detox from 'detox';
import { startAsync, send } from '../../relapse/server';

let stopAsync;
beforeAll(async () => {
  const customConsole = Object.assign(Object.create(console), {
    // We only want warnings and errors from the client to show up in the jest logs
    log() {},
    // RN saves a reference to the original implementation of `console.error` and calls it via
    // `console._errorOriginal` and the invocation is sent to Detox
    _errorOriginal(...args) {
      console.error(...args);
    },
  });

  // The testing modules we want to share with the client
  const API = {
    device: detox.device,
    detox,
    console: customConsole,
  };

  stopAsync = await startAsync({
    onConnect: () => {
      send({ globals: Object.keys(API) });
    },
    onEvent: (invocation, props) => {
      const [module, method] = invocation.split('.');
      API[module][method](...props);
    },
  });
});

afterAll(async () => {
  if (stopAsync) {
    await stopAsync();
  }
});
