import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findWorkspaceSpecs } from './verifyNoWorkspaceSpecs';

describe('findWorkspaceSpecs', () => {
  it('returns empty when no deps have workspace: specs', () => {
    const offenders = findWorkspaceSpecs(
      {
        dependencies: { foo: '^1.0.0' },
        peerDependencies: { bar: '*' },
      },
      'consumer'
    );
    assert.deepEqual(offenders, []);
  });

  it('detects workspace: in dependencies', () => {
    const offenders = findWorkspaceSpecs({ dependencies: { foo: 'workspace:*' } }, 'consumer');
    assert.deepEqual(offenders, [
      { packageName: 'consumer', depKey: 'dependencies', depName: 'foo', spec: 'workspace:*' },
    ]);
  });

  it('detects workspace: in devDependencies', () => {
    const offenders = findWorkspaceSpecs(
      { devDependencies: { foo: 'workspace:^1.0.0' } },
      'consumer'
    );
    assert.equal(offenders.length, 1);
    assert.equal(offenders[0].depKey, 'devDependencies');
  });

  it('detects workspace: in peerDependencies', () => {
    const offenders = findWorkspaceSpecs({ peerDependencies: { foo: 'workspace:*' } }, 'consumer');
    assert.equal(offenders.length, 1);
    assert.equal(offenders[0].depKey, 'peerDependencies');
  });

  it('detects workspace: in optionalDependencies', () => {
    const offenders = findWorkspaceSpecs(
      { optionalDependencies: { foo: 'workspace:~1.0.0' } },
      'consumer'
    );
    assert.equal(offenders.length, 1);
    assert.equal(offenders[0].depKey, 'optionalDependencies');
  });

  it('detects multiple offenders across different dep types', () => {
    const offenders = findWorkspaceSpecs(
      {
        dependencies: { a: 'workspace:*', b: '^1.0.0' },
        peerDependencies: { c: 'workspace:^' },
        optionalDependencies: { d: 'workspace:1.2.3' },
      },
      'consumer'
    );
    assert.equal(offenders.length, 3);
    assert.deepEqual(offenders.map((o) => o.depName).sort(), ['a', 'c', 'd']);
  });

  it('ignores non-string values', () => {
    const offenders = findWorkspaceSpecs(
      // Synthesizing malformed-but-real package.json: e.g. hand-edited file
      // accidentally putting an object/null where a string belongs.
      { dependencies: { foo: null as unknown as string, bar: { nested: 'oops' } as any } },
      'consumer'
    );
    assert.deepEqual(offenders, []);
  });

  it('ignores non-object dep collections', () => {
    const offenders = findWorkspaceSpecs(
      { dependencies: 'oops' as unknown as Record<string, string> },
      'consumer'
    );
    assert.deepEqual(offenders, []);
  });

  it('ignores undefined dep collections', () => {
    const offenders = findWorkspaceSpecs({}, 'consumer');
    assert.deepEqual(offenders, []);
  });

  it('reports the package name on each offender', () => {
    const offenders = findWorkspaceSpecs({ dependencies: { foo: 'workspace:*' } }, '@expo/ui');
    assert.equal(offenders[0].packageName, '@expo/ui');
  });
});
