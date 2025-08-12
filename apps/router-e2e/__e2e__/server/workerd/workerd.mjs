import { createRequestHandler } from '@expo/server/build/vendor/workerd';

console.log('Workerd server listening on configured port');

export default {
  async fetch(request) {
    const requestHandler = createRequestHandler(
      {
        build: '.',
      },
      {
        beforeResponse: (_router, response) => {
          response.headers['Custom-All-Header'] = 'all';
          return response;
        },
        beforeErrorResponse: (_router, response) => {
          response.headers['Custom-Error-Header'] = 'error';
          return response;
        },
        beforeAPIResponse(route, response) {
          response.headers['Custom-Api-Header'] = 'api';
          return response;
        },
        beforeHTMLResponse(route, response) {
          response.headers['Custom-Html-Header'] = 'html';
          return response;
        },
      }
    );

    return await requestHandler(request);
  },
};
