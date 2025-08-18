import { MiddlewareFunction } from 'expo-router/server';

const secret = new TextEncoder().encode(process.env.TEST_SECRET_KEY);

const middleware: MiddlewareFunction = async (request) => {
  const url = new URL(request.url);
  const scenario = url.searchParams.get('e2e');

  if (scenario === 'redirect') {
    return Response.redirect(new URL('/second', url.origin));
  }

  if (scenario === 'redirect-301') {
    return Response.redirect(new URL('/second', url.origin), 301);
  }

  if (scenario === 'error') {
    throw new Error('The middleware threw an error');
  }

  if (scenario === 'read-env') {
    return Response.json({
      ...process.env,
    });
  }

  if (scenario === 'custom-response') {
    return new Response(
      `<html><h1 data-testid="title">Custom response from middleware</h1></html>`,
      {
        headers: {
          'content-type': 'text/html',
        },
      }
    );
  }

  if (scenario === 'sign-jwt') {
    const { SignJWT } = await import('jose');
    const jwt = await new SignJWT({ foo: 'bar' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
    return new Response(JSON.stringify({ token: jwt }), {
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  if (scenario === 'verify-jwt') {
    const { jwtVerify } = await import('jose');
    const token = request.headers.get('authorization')!;
    const decoded = await jwtVerify(token, secret);
    return new Response(JSON.stringify({ payload: decoded.payload }), {
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  // If no E2E scenario is specified, continue to normal routing
};

export default middleware;
