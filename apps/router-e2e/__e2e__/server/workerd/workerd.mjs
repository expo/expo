import { createRequestHandler } from '@expo/server/build/vendor/workerd';

console.log('Workerd server listening on configured port');

export default {
  async fetch(request) {
    const requestHandler = createRequestHandler(
      {
        build: '.',
      },
      {
        beforeResponse: (response, route) => {
          response.headers['custom-all-type'] = route.type ?? 'unknown';
          response.headers['custom-all-route'] = route.page ?? 'unknown';
          return response;
        },
        beforeErrorResponse: (response, route) => {
          response.headers['custom-error-type'] = route.type ?? 'unknown';
          response.headers['custom-error-route'] = route.page ?? 'unknown';
          return response;
        },
        beforeAPIResponse(response, route) {
          response.headers['custom-api-type'] = route.type ?? 'unknown';
          response.headers['custom-api-route'] = route.page ?? 'unknown';
          return response;
        },
        beforeHTMLResponse(response, route) {
          response.headers['custom-html-type'] = route.type ?? 'unknown';
          response.headers['custom-html-route'] = route.page ?? 'unknown';
          return response;
        },
      }
    );

    return await requestHandler(request);
  },
};
