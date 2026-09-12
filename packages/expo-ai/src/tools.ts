import { LanguageModelError } from './LanguageModelError';
import type { ModelSchema, ToolContext } from './LanguageModels.types';
import { appleToolKind, type AppleToolKind } from './appleTools';
import { compileSchema } from './schema';

export type RuntimeTool = {
  name: string;
  description: string;
  inputSchema: ModelSchema;
  builtin?: AppleToolKind;
  execute(input: unknown, context: ToolContext): Promise<string>;
};

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

function invalidDefinition(): never {
  throw new LanguageModelError(
    'ERR_OPTIONS_INVALID',
    'Each tool needs a unique name, a nonempty description, an object inputSchema, and an execute handler.'
  );
}

/** Validate and snapshot definitions independently for each task or session. */
export function getTools(tools: readonly unknown[] = []): RuntimeTool[] {
  if (!Array.isArray(tools))
    throw new LanguageModelError('ERR_OPTIONS_INVALID', 'tools must be an array.');
  if (Reflect.ownKeys(tools).length !== tools.length + 1) invalidDefinition();
  const definitions: unknown[] = [];
  for (let index = 0; index < tools.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(tools, String(index));
    if (!descriptor || !descriptor.enumerable || !hasOwn(descriptor, 'value')) invalidDefinition();
    definitions.push(descriptor.value);
  }
  const names = new Set<string>();
  return definitions.map((definition) => {
    if (!definition || typeof definition !== 'object') invalidDefinition();
    const fields = Object.getOwnPropertyDescriptors(definition);
    const allowed = new Set(['name', 'description', 'inputSchema', 'execute']);
    for (const key of Reflect.ownKeys(definition)) {
      if (typeof key !== 'string' || !allowed.has(key)) invalidDefinition();
      const field = fields[key]!;
      if (!field.enumerable || !hasOwn(field, 'value')) invalidDefinition();
    }
    const name: unknown = fields.name?.value;
    const description: unknown = fields.description?.value;
    const execute: unknown = fields.execute?.value;
    if (
      typeof name !== 'string' ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(name) ||
      names.has(name) ||
      typeof description !== 'string' ||
      description.length === 0 ||
      typeof execute !== 'function'
    ) {
      invalidDefinition();
    }
    const inputSchema = compileSchema(fields.inputSchema?.value);
    if (inputSchema.type !== 'object') invalidDefinition();
    names.add(name);
    return {
      name,
      description,
      inputSchema,
      ...(appleToolKind(execute) ? { builtin: appleToolKind(execute) } : {}),
      async execute(input, context) {
        return serializeToolResult(await execute(input, context));
      },
    };
  });
}

/** Preserve strings and serialize ordinary JSON data without invoking accessors or toJSON. */
export function serializeToolResult(value: unknown): string {
  const ancestors = new WeakSet<object>();
  const fail = (path: string, message: string): never => {
    throw new LanguageModelError('ERR_TOOL_FAILED', `${path}: ${message}`);
  };
  function visit(item: unknown, path: string): string {
    if (item === null) return 'null';
    if (typeof item === 'string' || typeof item === 'boolean') return JSON.stringify(item);
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) fail(path, 'Tool results must contain finite numbers.');
      return JSON.stringify(item);
    }
    if (typeof item !== 'object') {
      return fail(
        path,
        'Tool results must contain only strings, finite numbers, booleans, null, arrays, and plain objects.'
      );
    }
    if (ancestors.has(item)) fail(path, 'Tool results cannot contain cycles.');
    ancestors.add(item);
    let result: string;
    if (Array.isArray(item)) {
      const prototype = Object.getPrototypeOf(item);
      if (prototype !== null && prototype !== Array.prototype) {
        fail(path, 'Tool result arrays must have an ordinary or null prototype.');
      }
      if (Reflect.ownKeys(item).length !== item.length + 1) {
        fail(path, 'Tool result arrays cannot have holes or extra properties.');
      }
      const values: string[] = [];
      for (let index = 0; index < item.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(item, String(index));
        if (!descriptor || !descriptor.enumerable || !hasOwn(descriptor, 'value')) {
          return fail(path, 'Tool result arrays cannot have holes or accessor elements.');
        }
        values.push(visit(descriptor.value, `${path}[${index}]`));
      }
      result = `[${values.join(',')}]`;
    } else {
      const prototype = Object.getPrototypeOf(item);
      if (prototype !== null && prototype !== Object.prototype) {
        fail(path, 'Tool results must use plain objects.');
      }
      const entries: string[] = [];
      for (const key of Reflect.ownKeys(item)) {
        const descriptor = Object.getOwnPropertyDescriptor(item, key)!;
        if (typeof key !== 'string' || !descriptor.enumerable || !hasOwn(descriptor, 'value')) {
          fail(path, 'Tool result properties must be enumerable strings without accessors.');
        }
        const escapedKey = JSON.stringify(key);
        entries.push(`${escapedKey}:${visit(descriptor.value, `${path}[${escapedKey}]`)}`);
      }
      result = `{${entries.join(',')}}`;
    }
    ancestors.delete(item);
    return result;
  }
  if (typeof value === 'string') return value;
  try {
    return visit(value, '$');
  } catch (cause) {
    if (cause instanceof LanguageModelError) throw cause;
    throw new LanguageModelError('ERR_TOOL_FAILED', 'The tool result could not be serialized.', {
      cause,
    });
  }
}

export function toolDeclarations(tools: readonly RuntimeTool[]) {
  return tools.map(({ execute, ...declaration }) => declaration);
}
