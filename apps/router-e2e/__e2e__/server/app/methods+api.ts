/** @type {import('expo-router/server').RequestHandler} */
export function GET() {
  return new Response(JSON.stringify({
    method: 'get',
  }));
}

export function POST() {
  return new Response(JSON.stringify({
    method: 'post',
  }));
}

export function PUT() {
  return new Response(JSON.stringify({
    method: 'put',
  }));
}

export function DELETE() {
  return new Response(JSON.stringify({
    method: 'delete',
  }));
}

export function PATCH() {
  return new Response(JSON.stringify({
    method: 'patch',
  }));
}

export function HEAD() {
  return new Response(JSON.stringify({
    method: 'head',
  }));
}

export function OPTIONS() {
  return new Response(JSON.stringify({
    method: 'options',
  }));
}
