function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export default async function middleware(request: Request): Promise<Response | void> {
  const url = new URL(request.url);
  const scenario = url.searchParams.get('e2e');

  if (scenario === 'redirect') {
    return Response.redirect(new URL('/second', url.origin));
  }

  if (scenario === 'redirect-301') {
    return Response.redirect(new URL('/second', url.origin), 301);
  }

  if (scenario === 'throw') {
    throw new Error('The middleware threw an error');
  }

  if (scenario === 'read-env') {
    return Response.json({
      ...process.env,
    })
  }

  if (scenario === 'slow') {
    await sleep(1000);
    return;
  }

  if (scenario === 'custom-response') {
    return new Response(`<html><h1>Custom response from middleware</h1></html>`, {
      headers: {
        'content-type': 'text/html',
      }
    });
  }

  // If no E2E scenario is specified, continue to normal routing
}