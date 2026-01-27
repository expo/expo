/**
 * A simplified implementation of `@expo/json-file`,
 * because `@expo/json-file` doesn't support ESM.
 */
import fs from 'node:fs';

export type JSONValue = boolean | number | string | null | JSONArray | JSONObject;
export interface JSONArray extends Array<JSONValue> {}
export interface JSONObject {
  [key: string]: JSONValue | undefined;
}

export async function readJsonFileAsync<T extends JSONObject>(filePath: string): Promise<T> {
  const json = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(json) as T;
}

export async function writeJsonFileAsync<T extends JSONObject>(
  filePath: string,
  data: T
): Promise<T> {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}

export async function mergeJsonFilesAsync<T extends JSONObject>(
  filePath: string,
  sources: Partial<T> | Partial<T>[]
): Promise<T> {
  const object = await readJsonFileAsync<T>(filePath);
  if (Array.isArray(sources)) {
    Object.assign(object, ...sources);
  } else {
    Object.assign(object, sources);
  }
  return await writeJsonFileAsync(filePath, object);
}
