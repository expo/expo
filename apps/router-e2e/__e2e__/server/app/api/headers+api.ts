export async function GET(_req: Request): Promise<Response> {
  const headers = new Headers();
  headers.append('x-custom-header', 'customValue');
  headers.append('x-multiple-header', 'value1');
  headers.append('x-multiple-header', 'value2');
  headers.append('set-cookie', 'key1=value1');
  headers.append('set-cookie', 'key2=value2');
  return new Response(JSON.stringify({ message: 'ok' }), { headers });
}
