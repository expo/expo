import { createRequestHandler } from '@expo/server/build/vendor/workerd';

console.log('Workerd server listening on configured port');

export default {
  async fetch(request, env, ctx) {
    const requestHandler = createRequestHandler(
      {
        build: '.',
      },
      {
        beforeResponse: (response, route) => {
          response.headers.set('custom-all-type', route.type ?? 'unknown');
          response.headers.set('custom-all-route', route.page ?? 'unknown');
          return response;
        },
        beforeErrorResponse: (response, route) => {
          response.headers.set('custom-error-type', route.type ?? 'unknown');
          response.headers.set('custom-error-route', route.page ?? 'unknown');
          return response;
        },
        beforeAPIResponse(response, route) {
          response.headers.set('custom-api-type', route.type ?? 'unknown');
          response.headers.set('custom-api-route', route.page ?? 'unknown');
          return response;
        },
        beforeHTMLResponse(response, route) {
          response.headers.set('custom-html-type', route.type ?? 'unknown');
          response.headers.set('custom-html-route', route.page ?? 'unknown');
          return response;
        },
      }
    );

    return await requestHandler(request, env, ctx);
  },
};
