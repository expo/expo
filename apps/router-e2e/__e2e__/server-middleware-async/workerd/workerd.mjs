import { createRequestHandler } from '@expo/server/build/vendor/workerd';

console.log('Workerd server listening on configured port');

export default {
  async fetch(request) {
    const requestHandler = createRequestHandler({
      build: '.',
    });
    return await requestHandler(request);
  },
};
