function fail(): never {
  throw new Error('Thrown from an API route');
}

export function GET(): Response {
  fail();
}
