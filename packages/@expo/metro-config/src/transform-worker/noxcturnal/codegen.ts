type HermesProgram = Record<string, unknown>;

const hermesParser = require('hermes-parser') as {
  parse(source: string, options: Record<string, unknown>): HermesProgram;
};

/**
 * Detect React Native Codegen before any native source mutation. Exact Codegen
 * imports and TurboModule specs are authoritative. Bare call-name detection is
 * intentionally conservative, but ignores locally declared/shadowed names.
 */
export function isReactNativeCodegenCandidate(source: string, filename: string): boolean {
  if (
    !source.includes('codegenNativeComponent') &&
    !source.includes('codegenNativeCommands') &&
    !source.includes('TurboModule')
  ) {
    return false;
  }
  // These declaration forms are themselves Codegen's public contract. Match
  // only from a statement boundary so mentions in comments, strings, and local
  // identifiers still take the semantic path below.
  if (
    /^[\t ]*import(?:[\t ]+type)?(?:[^;\n]|\n[\t ]+)*?from[\t ]*["'](?:react-native|[^"'\n]*(?:^|\/)codegenNative(?:Component|Commands))["'][\t ]*;?/m.test(
      source
    ) ||
    /^[\t ]*(?:export[\t ]+)?interface[\t ]+[A-Za-z_$][\w$]*[\t \n]+extends[\t \n]+TurboModule\b/m.test(
      source
    )
  ) {
    return true;
  }
  try {
    const ast = hermesParser.parse(source, {
      babel: false,
      flow: 'detect',
      sourceType: 'unambiguous',
      sourceFilename: filename,
    });
    const pending: unknown[] = [ast];
    const codegenCalls = new Set<string>();
    const localBindings = new Set<string>();
    let exactCodegenImport = false;
    let turboModuleSpec = false;
    while (pending.length > 0) {
      const node = pending.pop();
      if (node == null || typeof node !== 'object') continue;
      if (Array.isArray(node)) {
        pending.push(...node);
        continue;
      }
      const record = node as Record<string, unknown>;
      if (record.type === 'ImportDeclaration') {
        const importSource = record.source as Record<string, unknown> | undefined;
        if (typeof importSource?.value === 'string') {
          if (/(?:^|\/)codegenNative(?:Component|Commands)$/.test(importSource.value)) {
            exactCodegenImport = true;
          } else if (importSource.value === 'react-native') {
            for (const specifier of (record.specifiers as unknown[]) ?? []) {
              const imported = (specifier as Record<string, unknown>)?.imported as
                | Record<string, unknown>
                | undefined;
              if (
                imported?.type === 'Identifier' &&
                (imported.name === 'codegenNativeComponent' ||
                  imported.name === 'codegenNativeCommands')
              ) {
                exactCodegenImport = true;
              }
            }
          } else {
            for (const specifier of (record.specifiers as unknown[]) ?? []) {
              const local = (specifier as Record<string, unknown>)?.local as
                | Record<string, unknown>
                | undefined;
              if (local?.type === 'Identifier' && typeof local.name === 'string') {
                localBindings.add(local.name);
              }
            }
          }
        } else {
          for (const specifier of (record.specifiers as unknown[]) ?? []) {
            const local = (specifier as Record<string, unknown>)?.local as
              | Record<string, unknown>
              | undefined;
            if (local?.type === 'Identifier' && typeof local.name === 'string') {
              localBindings.add(local.name);
            }
          }
        }
      } else if (record.type === 'CallExpression') {
        const callee = record.callee as Record<string, unknown> | undefined;
        if (
          callee?.type === 'Identifier' &&
          (callee.name === 'codegenNativeComponent' || callee.name === 'codegenNativeCommands')
        ) {
          codegenCalls.add(callee.name);
        }
      } else if (record.type === 'InterfaceDeclaration') {
        const extensions = record.extends;
        if (
          Array.isArray(extensions) &&
          extensions.some((extension) => {
            const id = (extension as Record<string, unknown>)?.id as
              | Record<string, unknown>
              | undefined;
            return id?.type === 'Identifier' && id.name === 'TurboModule';
          })
        ) {
          turboModuleSpec = true;
        }
      } else if (record.type === 'TSInterfaceDeclaration') {
        const extensions = record.extends;
        if (
          Array.isArray(extensions) &&
          extensions.some((extension) => {
            const expression = (extension as Record<string, unknown>)?.expression as
              | Record<string, unknown>
              | undefined;
            return expression?.type === 'Identifier' && expression.name === 'TurboModule';
          })
        ) {
          turboModuleSpec = true;
        }
      } else if (
        record.type === 'FunctionDeclaration' ||
        record.type === 'ClassDeclaration' ||
        record.type === 'VariableDeclarator'
      ) {
        const id = record.id as Record<string, unknown> | undefined;
        if (id?.type === 'Identifier' && typeof id.name === 'string') {
          localBindings.add(id.name);
        }
      }
      for (const [key, value] of Object.entries(record)) {
        if (key !== 'loc' && key !== 'range' && key !== 'parent') {
          pending.push(value);
        }
      }
    }
    return (
      exactCodegenImport ||
      turboModuleSpec ||
      [...codegenCalls].some((name) => !localBindings.has(name))
    );
  } catch {
    // A hinted syntax that this preflight parser cannot understand must remain
    // pristine for Babel. False negatives here would allow native mutation
    // before React Native Codegen gets its required original source.
    return true;
  }
}
