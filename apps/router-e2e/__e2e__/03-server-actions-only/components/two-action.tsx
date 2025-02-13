'use server';
import 'server-only';
import fs from 'fs';
import path from 'node:path';

// A server action that mutates itself on every invocation to test HMR in development.
const fileNameHack = path.join(
  path.dirname(__filename.substring(0, __filename.lastIndexOf('.bundle'))),
  'two-action.tsx'
);

const GENERATED_RETURN = 'xxxxxx';

export async function two() {
  const contents = await fs.promises.readFile(fileNameHack, 'utf8');
  const newGeneratedValue = Math.random().toString(36).substring(7);
  const updated = contents.replace(
    /GENERATED_RETURN = '(.*)'/,
    `GENERATED_RETURN = '${newGeneratedValue}'`
  );
  await fs.promises.writeFile(fileNameHack, updated, 'utf8');

  return GENERATED_RETURN;
}
