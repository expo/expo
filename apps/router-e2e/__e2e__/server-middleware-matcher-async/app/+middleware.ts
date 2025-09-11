import { MiddlewareFunction } from 'expo-router/server';

export const unstable_settings = {
  matcher: {
    methods: process.env.E2E_MIDDLEWARE_MATCHER_METHODS ? JSON.parse(process.env.E2E_MIDDLEWARE_MATCHER_METHODS) : undefined,
    patterns: process.env.E2E_MIDDLEWARE_MATCHER_PATTERNS ? JSON.parse(process.env.E2E_MIDDLEWARE_MATCHER_PATTERNS) : undefined,
  },
};

const middleware: MiddlewareFunction = async (request) => {
  return new Response(JSON.stringify({ match: true }), {
    headers: {
      'content-type': 'application/json',
    },
  });
};

export default middleware;