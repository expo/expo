import vm from 'node:vm';

import { getServerRunModuleStatement } from '../getServerRunModuleStatement';

it.each([
  'globalThis.loaded = true;\n__r(1);',
  'const startedAt = Date.now();\n__r(1);',
  'setup(); __r(1);',
  'setup(); __r(1); setup();',
  '__r(0);\n__r(1);',
  'module.exports = __r(1);',
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
    __r: (id: number) => (id === 1 ? entry : {}),
    setup() {},
  });
  expect(module.exports).toBe(entry);
});

it.each(['const entry = __r(1);', 'setup();\nruntime.require(1);'])(
  'preserves unsupported custom statements: %s',
  (statement) => {
    const getStatement = getServerRunModuleStatement('entry', {
      createModuleId: () => 1,
      getRunModuleStatement: () => statement,
    });
    expect(getStatement(1, '')).toBe(statement);
  }
);

it('exports prefixed entry calls without moving trailing side effects', () => {
  const events: string[] = [];
  const original = jest.fn((id, prefix) => `before();\n${prefix}__r(${id});\nafter();`);
  const options = { createModuleId: () => 1, getRunModuleStatement: original };
  const first = getServerRunModuleStatement('entry', options);
  const wrapped = getServerRunModuleStatement('entry', {
    ...options,
    getRunModuleStatement: first,
  });
  const entry = {};
  const module = { exports: {} };
  vm.runInNewContext(wrapped(1, '$prefix_'), {
    module,
    $prefix___r() {
      events.push('entry');
      return entry;
    },
    before() {
      events.push('before');
    },
    after() {
      events.push('after');
    },
  });
  expect(module.exports).toBe(entry);
  expect(events).toEqual(['before', 'entry', 'after']);
  expect(original).toHaveBeenCalledWith(1, '$prefix_');
  expect(wrapped(0, '$prefix_')).toBe('before();\n$prefix___r(0);\nafter();');
});
