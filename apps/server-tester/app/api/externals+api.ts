import fs from 'node:fs';
import path from 'node:path';

export function GET(): Response {
  // Reference a Node.js built-in so the bundle keeps it external.
  console.log(typeof fs.readFileSync);
  return new Response(path.join('a', 'b', 'c'), { status: 200 });
}
