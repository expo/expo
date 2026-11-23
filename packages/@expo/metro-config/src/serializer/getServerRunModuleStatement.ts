import type { SerializerOptions } from '@expo/metro/metro/DeltaBundler/types';

type RunModuleStatement = SerializerOptions['getRunModuleStatement'];

// Nested serializer boundaries must not export the same entry more than once.
const originalStatements = new WeakMap<RunModuleStatement, RunModuleStatement>();

export function getServerRunModuleStatement(
  entryPoint: string,
  options: Pick<SerializerOptions, 'createModuleId' | 'getRunModuleStatement'>
): RunModuleStatement {
  const original =
    originalStatements.get(options.getRunModuleStatement) ?? options.getRunModuleStatement;
  const getRunModuleStatement: RunModuleStatement = (moduleId, ...args) => {
    const statement = original(moduleId, ...args);
    if (moduleId !== options.createModuleId(entryPoint)) return statement;
    const prefix = (args[0] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const requireName = prefix ? `(?:${prefix}__r|__r)` : '__r';
    const entryCall = new RegExp(
      `(^|[;\\n])(\\s*)(${requireName}\\s*\\([^;\\n]*?\\)\\s*)(?=;|$|\\n)`,
      'g'
    );
    return statement.replace(entryCall, '$1$2module.exports = $3');
  };
  originalStatements.set(getRunModuleStatement, original);
  return getRunModuleStatement;
}
