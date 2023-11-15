import { codeFrameColumns } from '@babel/code-frame';
import fs from 'fs';
import JSON5 from 'json5';
import path from 'path';
import { promisify } from 'util';
import writeFileAtomic from 'write-file-atomic';

import JsonFileError, { EmptyJsonFileError } from './JsonFileError';

const writeFileAtomicAsync: (
  filename: string,
  data: string | Buffer,
  options: writeFileAtomic.Options
) => void = promisify(writeFileAtomic);

export type JSONValue = boolean | number | string | null | JSONArray | JSONObject;
export interface JSONArray extends Array<JSONValue> {}
export interface JSONObject {
  [key: string]: JSONValue | undefined;
}

type Defined<T> = T extends undefined ? never : T;

type Options<TJSONObject extends JSONObject> = {
  badJsonDefault?: TJSONObject;
  jsonParseErrorDefault?: TJSONObject;
  cantReadFileDefault?: TJSONObject;
  ensureDir?: boolean;
  default?: TJSONObject;
  json5?: boolean;
  space?: number;
  addNewLineAtEOF?: boolean;
};

const DEFAULT_OPTIONS = {
  badJsonDefault: undefined,
  jsonParseErrorDefault: undefined,
  cantReadFileDefault: undefined,
  ensureDir: false,
  default: undefined,
  json5: false,
  space: 2,
  addNewLineAtEOF: true,
};

/**
 * The JsonFile class represents the contents of json file.
 *
 * It's polymorphic on "JSONObject", which is a simple type representing
 * and object with string keys and either objects or primitive types as values.
 * @type {[type]}
 */
export default class JsonFile<TJSONObject extends JSONObject> {
  file: string;
  options: Options<TJSONObject>;

  static read = read;
  static readAsync = readAsync;
  static parseJsonString = parseJsonString;
  static writeAsync = writeAsync;
  static getAsync = getAsync;
  static setAsync = setAsync;
  static mergeAsync = mergeAsync;
  static deleteKeyAsync = deleteKeyAsync;
  static deleteKeysAsync = deleteKeysAsync;
  static rewriteAsync = rewriteAsync;

  constructor(file: string, options: Options<TJSONObject> = {}) {
    this.file = file;
    this.options = options;
  }

  read(options?: Options<TJSONObject>): TJSONObject {
    return read(this.file, this._getOptions(options));
  }

  async readAsync(options?: Options<TJSONObject>): Promise<TJSONObject> {
    return readAsync(this.file, this._getOptions(options));
  }

  async writeAsync(object: TJSONObject, options?: Options<TJSONObject>) {
    return writeAsync(this.file, object, this._getOptions(options));
  }

  parseJsonString(json: string, options?: Options<TJSONObject>): TJSONObject {
    return parseJsonString(json, options);
  }

  async getAsync<K extends keyof TJSONObject, TDefault extends TJSONObject[K] | null>(
    key: K,
    defaultValue: TDefault,
    options?: Options<TJSONObject>
  ): Promise<Defined<TJSONObject[K]> | TDefault> {
    return getAsync(this.file, key, defaultValue, this._getOptions(options));
  }

  async setAsync(key: string, value: unknown, options?: Options<TJSONObject>) {
    return setAsync(this.file, key, value, this._getOptions(options));
  }

  async mergeAsync(
    sources: Partial<TJSONObject> | Partial<TJSONObject>[],
    options?: Options<TJSONObject>
  ): Promise<TJSONObject> {
    return mergeAsync<TJSONObject>(this.file, sources, this._getOptions(options));
  }

  async deleteKeyAsync(key: string, options?: Options<TJSONObject>) {
    return deleteKeyAsync(this.file, key, this._getOptions(options));
  }

  async deleteKeysAsync(keys: string[], options?: Options<TJSONObject>) {
    return deleteKeysAsync(this.file, keys, this._getOptions(options));
  }

  async rewriteAsync(options?: Options<TJSONObject>) {
    return rewriteAsync(this.file, this._getOptions(options));
  }

  _getOptions(options?: Options<TJSONObject>): Options<TJSONObject> {
    return {
      ...this.options,
      ...options,
    };
  }
}

function read<TJSONObject extends JSONObject>(
  file: string,
  options?: Options<TJSONObject>
): TJSONObject {
  let json;
  try {
    json = fs.readFileSync(file, 'utf8');
  } catch (error: any) {
    assertEmptyJsonString(json, file);
    const defaultValue = cantReadFileDefault(options);
    if (defaultValue === undefined) {
      throw new JsonFileError(`Can't read JSON file: ${file}`, error, error.code, file);
    } else {
      return defaultValue;
    }
  }
  return parseJsonString(json, options, file);
}

async function readAsync<TJSONObject extends JSONObject>(
  file: string,
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  let json;
  try {
    json = await fs.promises.readFile(file, 'utf8');
  } catch (error: any) {
    assertEmptyJsonString(json, file);
    const defaultValue = cantReadFileDefault(options);
    if (defaultValue === undefined) {
      throw new JsonFileError(`Can't read JSON file: ${file}`, error, error.code);
    } else {
      return defaultValue;
    }
  }
  return parseJsonString(json, options);
}

function parseJsonString<TJSONObject extends JSONObject>(
  json: string,
  options?: Options<TJSONObject>,
  fileName?: string
): TJSONObject {
  assertEmptyJsonString(json, fileName);
  try {
    if (_getOption(options, 'json5')) {
      return JSON5.parse(json);
    } else {
      return JSON.parse(json);
    }
  } catch (e: any) {
    const defaultValue = jsonParseErrorDefault(options);
    if (defaultValue === undefined) {
      const location = locationFromSyntaxError(e, json);
      if (location) {
        const codeFrame = codeFrameColumns(json, { start: location });
        e.codeFrame = codeFrame;
        e.message += `\n${codeFrame}`;
      }
      throw new JsonFileError(`Error parsing JSON: ${json}`, e, 'EJSONPARSE', fileName);
    } else {
      return defaultValue;
    }
  }
}

async function getAsync<TJSONObject extends JSONObject, K extends keyof TJSONObject, DefaultValue>(
  file: string,
  key: K,
  defaultValue: DefaultValue,
  options?: Options<TJSONObject>
): Promise<any> {
  const object = await readAsync(file, options);
  if (key in object) {
    return object[key];
  }
  if (defaultValue === undefined) {
    throw new JsonFileError(`No value at key path "${key}" in JSON object from: ${file}`);
  }
  return defaultValue;
}

async function writeAsync<TJSONObject extends JSONObject>(
  file: string,
  object: TJSONObject,
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  if (options?.ensureDir) {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
  }
  const space = _getOption(options, 'space');
  const json5 = _getOption(options, 'json5');
  const addNewLineAtEOF = _getOption(options, 'addNewLineAtEOF');
  let json;
  try {
    if (json5) {
      json = JSON5.stringify(object, null, space);
    } else {
      json = JSON.stringify(object, null, space);
    }
  } catch (e: any) {
    throw new JsonFileError(`Couldn't JSON.stringify object for file: ${file}`, e);
  }
  const data = addNewLineAtEOF ? `${json}\n` : json;
  await writeFileAtomicAsync(file, data, {});
  return object;
}

async function setAsync<TJSONObject extends JSONObject>(
  file: string,
  key: string,
  value: unknown,
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  // TODO: Consider implementing some kind of locking mechanism, but
  // it's not critical for our use case, so we'll leave it out for now
  const object = await readAsync(file, options);
  return writeAsync(file, { ...object, [key]: value }, options);
}

async function mergeAsync<TJSONObject extends JSONObject>(
  file: string,
  sources: Partial<TJSONObject> | Partial<TJSONObject>[],
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  const object = await readAsync(file, options);
  if (Array.isArray(sources)) {
    Object.assign(object, ...sources);
  } else {
    Object.assign(object, sources);
  }
  return writeAsync(file, object, options);
}

async function deleteKeyAsync<TJSONObject extends JSONObject>(
  file: string,
  key: string,
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  return deleteKeysAsync(file, [key], options);
}

async function deleteKeysAsync<TJSONObject extends JSONObject>(
  file: string,
  keys: string[],
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  const object = await readAsync(file, options);
  let didDelete = false;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (object.hasOwnProperty(key)) {
      delete object[key];
      didDelete = true;
    }
  }

  if (didDelete) {
    return writeAsync(file, object, options);
  }
  return object;
}

async function rewriteAsync<TJSONObject extends JSONObject>(
  file: string,
  options?: Options<TJSONObject>
): Promise<TJSONObject> {
  const object = await readAsync(file, options);
  return writeAsync(file, object, options);
}

function jsonParseErrorDefault<TJSONObject extends JSONObject>(
  options: Options<TJSONObject> = {}
): TJSONObject | void {
  if (options.jsonParseErrorDefault === undefined) {
    return options.default;
  } else {
    return options.jsonParseErrorDefault;
  }
}

function cantReadFileDefault<TJSONObject extends JSONObject>(
  options: Options<TJSONObject> = {}
): TJSONObject | void {
  if (options.cantReadFileDefault === undefined) {
    return options.default;
  } else {
    return options.cantReadFileDefault;
  }
}

function _getOption<TJSONObject extends JSONObject, K extends keyof Options<TJSONObject>>(
  options: Options<TJSONObject> | undefined,
  field: K
): Options<TJSONObject>[K] {
  if (options) {
    if (options[field] !== undefined) {
      return options[field];
    }
  }
  return DEFAULT_OPTIONS[field];
}

function locationFromSyntaxError(error: any, sourceString: string) {
  // JSON5 SyntaxError has lineNumber and columnNumber.
  if ('lineNumber' in error && 'columnNumber' in error) {
    return { line: error.lineNumber, column: error.columnNumber };
  }
  // JSON SyntaxError only includes the index in the message.
  const match = /at position (\d+)/.exec(error.message);
  if (match) {
    const index = parseInt(match[1], 10);
    const lines = sourceString.slice(0, index + 1).split('\n');
    return { line: lines.length, column: lines[lines.length - 1].length };
  }

  return null;
}

function assertEmptyJsonString(json?: string, file?: string) {
  if (json?.trim() === '') {
    throw new EmptyJsonFileError(file);
  }
}
