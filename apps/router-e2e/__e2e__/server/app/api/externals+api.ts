import fs from 'node:fs';
import path from 'path';

export function GET(): Response {
  console.log(fs);
  // const txt = fs.readFileSync(path.join(__dirname, '../../../file.txt'), 'utf8');
  return new Response(path.join('a', 'b', 'c'), { status: 200 });
}
