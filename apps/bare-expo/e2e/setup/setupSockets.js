import * as detox from 'detox';
import { startAsync, send } from '../../relapse/server';

let stopAsync;
beforeAll(async () => {
  const customConsole = { ...console };
  // We only want warnings and errors from the client to show up in the jest logs
  customConsole.log = () => {};

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
      // eval(`${fcName}(${props[0]})`);
    },
  });
});

afterAll(async () => {
  if (stopAsync) {
    await stopAsync();
  }
});
