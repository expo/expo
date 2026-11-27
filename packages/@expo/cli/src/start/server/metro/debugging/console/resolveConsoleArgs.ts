import chalk from 'chalk';
import { format, inspect } from 'node:util';

import type { ConsoleSession } from './ConsoleSession';
import type { ObjectPreview, RemoteObject } from './types';

const SERIALIZE_TIMEOUT_MS = 500;
const TAG = '@@expo/console';

type SerializedNode =
  | { [TAG]: 'date'; value: string }
  | { [TAG]: 'error'; value: string }
  | { [TAG]: 'map'; value: [unknown, unknown][] }
  | { [TAG]: 'set'; value: unknown[] }
  | { [TAG]: 'raw'; value: string };

/**
 * Runs inside the app, with `this` bound to the logged object. It returns JSON text, since Hermes
 * sorts the keys of an object returned by value.
 */
const SERIALIZE_FUNCTION = `function () {
  var TAG = ${JSON.stringify(TAG)};
  var MAX_DEPTH = 4;
  var MAX_ITEMS = 100;
  var seen = new Set();
  function tag(type, value) {
    var node = {};
    node[TAG] = type;
    node.value = value;
    return node;
  }
  function walk(value, depth) {
    var type = typeof value;
    if (type === 'function') return tag('raw', '[Function ' + (value.name || 'anonymous') + ']');
    if (type === 'symbol' || type === 'bigint') return tag('raw', String(value) + (type === 'bigint' ? 'n' : ''));
    if (type === 'undefined') return tag('raw', 'undefined');
    if (type === 'number' && !isFinite(value)) return tag('raw', String(value));
    if (value === null || type !== 'object') return value;
    if (seen.has(value)) return tag('raw', '[Circular]');
    if (typeof value.$$typeof === 'symbol' && value.type != null) {
      var name = typeof value.type === 'string' ? value.type : value.type.displayName || value.type.name;
      return tag('raw', '<' + (name || 'Unknown') + ' />');
    }
    if (value instanceof Date) return tag('date', value.toISOString());
    if (value instanceof Error) return tag('error', String(value.stack || value));
    if (depth >= MAX_DEPTH) return tag('raw', Array.isArray(value) ? '[Array]' : '[Object]');
    seen.add(value);
    var result;
    if (value instanceof Map) {
      result = tag('map', Array.from(value).slice(0, MAX_ITEMS).map(function (entry) {
        return [walk(entry[0], depth + 1), walk(entry[1], depth + 1)];
      }));
    } else if (value instanceof Set) {
      result = tag('set', Array.from(value).slice(0, MAX_ITEMS).map(function (item) {
        return walk(item, depth + 1);
      }));
    } else if (Array.isArray(value)) {
      result = value.slice(0, MAX_ITEMS).map(function (item) { return walk(item, depth + 1); });
    } else {
      result = {};
      Object.keys(value).slice(0, MAX_ITEMS).forEach(function (key) {
        result[key] = walk(value[key], depth + 1);
      });
    }
    seen.delete(value);
    return result;
  }
  return JSON.stringify(walk(this, 0));
}`;

const FORMAT_SPECIFIER = /%[sdifoO%]/;

/**
 * Converts the arguments of a console call into the text Node's own `console` prints for them.
 * The stack of each logged error follows the arguments, unsymbolicated.
 */
export async function resolveConsoleArgsAsync(
  session: ConsoleSession,
  args: RemoteObject[]
): Promise<string[]> {
  const resolved = await Promise.all(args.map((arg) => resolveArgAsync(session, arg)));
  const errorStacks = args.filter(isError).map((arg) => arg.description);
  const template = resolved[0];
  if (args.length > 1 && args[0]?.type === 'string' && FORMAT_SPECIFIER.test(template!)) {
    const substitutions = args
      .slice(1)
      .map((arg, index) => (arg.type === 'number' ? arg.value : resolved[index + 1]));
    return [format(template!.replace(/%[oO]/g, '%s'), ...substitutions), ...errorStacks];
  }
  return [...resolved, ...errorStacks];
}

async function resolveArgAsync(session: ConsoleSession, arg: RemoteObject): Promise<string> {
  if (arg.type === 'string') {
    return String(arg.value);
  }
  if (arg.objectId == null) {
    return arg.unserializableValue ?? inspectValue(arg.value);
  }

  try {
    if (isError(arg)) {
      return `[${errorHeadline(arg.description)}]`;
    }
    if (arg.type !== 'object') {
      return arg.description ?? arg.type;
    }
    return inspectValue(revive(await serializeAsync(session, arg.objectId)));
  } catch {
    return arg.preview ? formatPreview(arg.preview) : (arg.description ?? arg.type);
  } finally {
    session.send('Runtime.releaseObject', { objectId: arg.objectId }).catch(() => {});
  }
}

async function serializeAsync(session: ConsoleSession, objectId: string): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out')), SERIALIZE_TIMEOUT_MS);
  });
  try {
    const response = await Promise.race([
      session.send<{ result?: { value?: unknown }; exceptionDetails?: unknown }>(
        'Runtime.callFunctionOn',
        { objectId, functionDeclaration: SERIALIZE_FUNCTION, returnByValue: true }
      ),
      timeout,
    ]);
    if (response.exceptionDetails || typeof response.result?.value !== 'string') {
      throw new Error('Serialization failed');
    }
    return JSON.parse(response.result.value);
  } finally {
    clearTimeout(timer);
  }
}

function revive(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(revive);
  }
  if (node == null || typeof node !== 'object') {
    return node;
  }
  if (TAG in node) {
    const tagged = node as SerializedNode;
    switch (tagged[TAG]) {
      case 'date':
        return new Date(tagged.value);
      case 'error':
        return printable(`[${errorHeadline(tagged.value)}]`);
      case 'map':
        return new Map(tagged.value.map(([key, value]) => [revive(key), revive(value)]));
      case 'set':
        return new Set(tagged.value.map(revive));
      case 'raw':
        return printable(tagged.value);
    }
  }
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, revive(value)]));
}

function formatPreview(preview: ObjectPreview): string {
  const isArray = preview.subtype === 'array';
  const properties = preview.properties.map((property) => {
    const value = property.type === 'string' ? inspectValue(property.value) : property.value;
    return isArray ? value : `${property.name}: ${value}`;
  });
  if (preview.overflow) {
    properties.push('…');
  }
  return isArray ? `[${properties.join(', ')}]` : `{ ${properties.join(', ')} }`;
}

function isError(arg: RemoteObject): arg is RemoteObject & { description: string } {
  return arg.subtype === 'error' && typeof arg.description === 'string';
}

function errorHeadline(stack: string): string {
  const firstFrame = stack.indexOf('\n    at ');
  return firstFrame === -1 ? stack : stack.slice(0, firstFrame);
}

function inspectValue(value: unknown): string {
  return inspect(value, {
    colors: chalk.level > 0,
    depth: Infinity,
    breakLength: process.stdout.columns ?? 80,
  });
}

function printable(text: string): { [inspect.custom](): string } {
  return { [inspect.custom]: () => text };
}
