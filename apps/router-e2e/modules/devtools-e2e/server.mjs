
// Top-level async to ensure esm modules are loaded correctly
// require of esm in modern Node works(*)
await undefined;

export default async function handler(request, context) {
  const url = new URL(request.url);

  if (url.pathname === '/api/hello') {
    return new Response(
      JSON.stringify({
        message: `Hello from the plugin server! You sent a ${request.method} request.`,
        time: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Dynamic WebSocket routes: the channel name is part of the path, so it cannot be
  // mounted statically through `webSocketHandlers`.
  const dynamicChannel = url.pathname.match(/^\/ws\/dynamic\/([^/]+)$/)?.[1];
  if (dynamicChannel) {
    const response = context.upgrade({
      onopen(peer) {
        peer.send({
          type: 'welcome',
          message: `Connected to dynamic channel "${dynamicChannel}".`,
          pathname: url.pathname,
          search: url.search,
        });
      },
      onmessage(peer, message) {
        peer.send({ type: 'echo', channel: dynamicChannel, message: message.text() });
      },
    });
    response.headers.set('x-devtools-channel', dynamicChannel);
    return response;
  }

  // Fallback to static plugin page
  return null;
};

export const webSocketHandlers = {
  '/ws': (socket, request) => {
    const url = new URL(request.url);
    socket.send(
      JSON.stringify({
        type: 'welcome',
        message: 'Connected to the Hello World plugin server.',
        pathname: url.pathname,
        search: url.search,
      })
    );
    socket.on('message', (data) => {
      socket.send(JSON.stringify({ type: 'echo', message: data.toString() }));
    });
  },
};
