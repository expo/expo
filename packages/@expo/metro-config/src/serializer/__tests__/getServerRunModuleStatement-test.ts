import vm from 'node:vm';

import { getServerRunModuleStatement } from '../getServerRunModuleStatement';

it.each([
  'globalThis.loaded = true;\n__r(1);',
  'const startedAt = Date.now();\n__r(1);',
  'setup(); __r(1);',
  'setup();\n  __r (1)\n',
])('exports the entry call after custom setup: %s', (statement) => {
  const getStatement = getServerRunModuleStatement('entry', {
    createModuleId: () => 1,
    getRunModuleStatement: () => statement,
  });
  const entry = { GET() {} };
  const module = { exports: {} };
  vm.runInNewContext(getStatement(1, ''), {
    module,
    __r: () => entry,
    setup() {},
  });
  expect(module.exports).toBe(entry);
});

it.each(['const entry = __r(1);', 'setup();\nruntime.require(1);'])(
  'rejects a run-module statement without a final __r call: %s',
  (statement) => {
    const getStatement = getServerRunModuleStatement('entry', {
      createModuleId: () => 1,
      getRunModuleStatement: () => statement,
    });
    expect(() => getStatement(1, '')).toThrow(/getRunModuleStatement.*__r call/);
  }
);
