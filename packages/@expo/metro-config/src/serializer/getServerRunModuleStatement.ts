import type { SerializerOptions } from '@expo/metro/metro/DeltaBundler/types';
import assert from 'assert';

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
    if (statement.startsWith('__r(')) return 'module.exports = ' + statement;
    const entryCall = /(^|[;\n])(\s*)(__r\s*\([^;\n]*\)\s*;?\s*)$/;
    assert(
      entryCall.test(statement),
      'Cannot export the server entry because serializer.getRunModuleStatement does not end with a standalone __r call. Return setup statements followed by the entry-module call.'
    );
    return statement.replace(entryCall, '$1$2module.exports = $3');
  };
  originalStatements.set(getRunModuleStatement, original);
  return getRunModuleStatement;
}
