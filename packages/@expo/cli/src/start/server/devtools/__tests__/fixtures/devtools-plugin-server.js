/* global Response, URL */
module.exports = async function handler(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/hello') {
    return new Response(JSON.stringify({ message: 'hello' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
};
