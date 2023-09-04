import { ExpoResponse } from 'expo-router/server';
import fs from 'node:fs';
import path from 'path';

export function GET(): ExpoResponse {
  const txt = fs.readFileSync(path.join(__dirname, '../../../file.txt'), 'utf8');
  return new ExpoResponse(txt, { status: 200 });
}
