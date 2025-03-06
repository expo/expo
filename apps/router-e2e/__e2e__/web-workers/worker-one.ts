// Use an external module that should be bundled.
import { multiply } from './math';

self.onmessage = (event) => {
  const { data } = event;
  const result = multiply(data, 2);
  self.postMessage(result);
};
