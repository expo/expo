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
    return moduleId === options.createModuleId(entryPoint)
      ? 'module.exports = ' + statement
      : statement;
  };
  originalStatements.set(getRunModuleStatement, original);
  return getRunModuleStatement;
}
