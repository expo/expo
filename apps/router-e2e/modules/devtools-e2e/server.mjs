
// Top-level async to ensure esm modules are loaded correctly
// require of esm in modern Node works(*)
await undefined;

export default async function handler(request) {
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

  // Fallback to static plugin page
  return null;
};

export const webSocketHandlers = {
  '/ws': (socket) => {
    socket.send(
      JSON.stringify({ type: 'welcome', message: 'Connected to the Hello World plugin server.' })
    );
    socket.on('message', (data) => {
      socket.send(JSON.stringify({ type: 'echo', message: data.toString() }));
    });
  },
};
