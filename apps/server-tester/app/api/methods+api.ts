function methodResponse(method: string) {
  return Response.json({ method });
}

export function GET() {
  return methodResponse('get');
}

export function POST() {
  return methodResponse('post');
}

export function PUT() {
  return methodResponse('put');
}

export function DELETE() {
  return methodResponse('delete');
}

export function PATCH() {
  return methodResponse('patch');
}

export function HEAD() {
  return methodResponse('head');
}

export function OPTIONS() {
  return methodResponse('options');
}
