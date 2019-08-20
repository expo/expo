import * as detox from 'detox';
import { startAsync } from '../relapse/server';

const { device } = detox;

let stopAsync;
beforeAll(async () => {
  const API = {
    device,
    detox,
    console,
  };

  stopAsync = await startAsync({
    onEvent: (invocation, props) => {
      const [clss, method] = invocation.split('.');
      API[clss][method](...props);
      // eval(`${fcName}(${props[0]})`);
    },
  });
});

afterAll(async () => {
  if (stopAsync) {
    await stopAsync();
  }
});
