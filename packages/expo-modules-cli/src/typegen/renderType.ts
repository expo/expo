import type { JSType, TypeNode } from 'expo-modules-macros';

/** The TypeScript type for each `typeof` a primitive can report. `function` has none. */
const PRIMITIVE_TYPES: Partial<Record<JSType, string>> = {
  boolean: 'boolean',
  number: 'number',
  string: 'string',
  bigint: 'bigint',
  symbol: 'symbol',
  undefined: 'undefined',
  object: 'object',
};

/**
 * What a warning is about: a type rendered as `unknown`, a type loosened to a wider one such as
 * `number` or `never`, a declaration or member skipped, or an events map inlined into its class.
 */
export type RenderWarningKind = 'unknown' | 'loosened' | 'skipped' | 'inlined';

export type RenderContext = {
  /** Maps a Swift type name to the TS name of a scanned record, shared object, or module. */
  resolveRef(name: string): string | undefined;
  /** Receives each gap the renderer had to paper over, with its kind and a message. */
  warn(kind: RenderWarningKind, message: string): void;
};

/**
 * Renders a scanner `TypeNode` as TypeScript source. Anything the scanner could not model, or a
 * reference to a type it did not scan, becomes `unknown` and is reported through `ctx.warn` so the
 * gap stays visible instead of silently loosening the generated API.
 */
export function renderType(node: TypeNode, ctx: RenderContext): string {
  switch (node.kind) {
    case 'primitive': {
      const type = PRIMITIVE_TYPES[node.typeof];
      if (type) {
        return type;
      }
      ctx.warn(
        'unknown',
        `primitive '${node.name}' reported as typeof '${node.typeof}' has no TypeScript type, rendered as unknown`
      );
      return 'unknown';
    }
    case 'optional': {
      // `| null` would otherwise bind to a closure's result type instead of the closure itself.
      const wrapped = renderType(node.wrapped, ctx);
      return `${node.wrapped.kind === 'function' ? `(${wrapped})` : wrapped} | null`;
    }
    case 'array': {
      const element = renderType(node.element, ctx);
      return `${isCompound(element) ? `(${element})` : element}[]`;
    }
    case 'dictionary':
      return `Record<${renderType(node.key, ctx)}, ${renderType(node.value, ctx)}>`;
    case 'promise':
      return `Promise<${renderType(node.value, ctx)}>`;
    case 'function': {
      // Closure parameters carry types only, so they get positional names.
      const parameters = node.parameters
        .map((parameter, index) => `arg${index}: ${renderType(parameter, ctx)}`)
        .join(', ');
      return `(${parameters}) => ${renderReturnType(node.returns, node.async, ctx)}`;
    }
    case 'ref': {
      const resolved = ctx.resolveRef(node.name);
      if (resolved) {
        return resolved;
      }
      ctx.warn('unknown', `unresolved type '${node.name}' rendered as unknown`);
      return 'unknown';
    }
    case 'unknown':
      ctx.warn('unknown', `unmodeled Swift type '${node.text}' rendered as unknown`);
      return 'unknown';
  }
}

/**
 * Renders a function's result: `void` when absent, and wrapped in a promise for an async function
 * unless the declared result already is one.
 */
export function renderReturnType(
  returns: TypeNode | undefined,
  isAsync: boolean,
  ctx: RenderContext
): string {
  const result = returns ? renderType(returns, ctx) : 'void';
  if (isAsync && returns?.kind !== 'promise') {
    return `Promise<${result}>`;
  }
  return result;
}

/** A union or closure type needs parentheses before an array suffix. */
function isCompound(rendered: string): boolean {
  return rendered.includes(' | ') || rendered.includes(' => ');
}
