import { build } from '@bacons/xcode/json';

import { compareGraphs, compareResults, compareSemantics, normalizedTextDiff } from './comparator';

const hex = (n: number) => n.toString(16).toUpperCase().padStart(24, '0');

describe('compareGraphs (semantic, UUID-independent)', () => {
  it('treats identical structure with different UUIDs as equal', () => {
    const mk = (base: number) => ({
      rootObject: hex(base),
      objects: {
        [hex(base)]: { isa: 'PBXProject', mainGroup: hex(base + 1), targets: [hex(base + 2)] },
        [hex(base + 1)]: { isa: 'PBXGroup', children: [] },
        [hex(base + 2)]: {
          isa: 'PBXNativeTarget',
          name: 'App',
          buildConfigurationList: hex(base + 3),
        },
        [hex(base + 3)]: { isa: 'XCConfigurationList', buildConfigurations: [] },
      },
    });
    expect(compareGraphs(mk(1), mk(101))).toEqual({ equal: true });
  });

  it('ignores dictionary key order', () => {
    const a = { rootObject: hex(1), objects: { [hex(1)]: { isa: 'PBXProject', a: 1, b: 2 } } };
    const b = { rootObject: hex(1), objects: { [hex(1)]: { isa: 'PBXProject', b: 2, a: 1 } } };
    expect(compareGraphs(a, b).equal).toBe(true);
  });

  it('is order-sensitive for arrays', () => {
    const mk = (children: string[]) => ({
      rootObject: hex(1),
      objects: {
        [hex(1)]: { isa: 'PBXProject', mainGroup: hex(2) },
        [hex(2)]: { isa: 'PBXGroup', children },
        [hex(3)]: { isa: 'PBXFileReference', path: 'A' },
        [hex(4)]: { isa: 'PBXFileReference', path: 'B' },
      },
    });
    expect(compareGraphs(mk([hex(3), hex(4)]), mk([hex(4), hex(3)])).equal).toBe(false);
  });

  it('catches a scalar divergence with a path', () => {
    const mk = (region: string) => ({
      rootObject: hex(1),
      objects: { [hex(1)]: { isa: 'PBXProject', developmentRegion: region } },
    });
    const diff = compareGraphs(mk('en'), mk('fr'));
    expect(diff.equal).toBe(false);
    expect(diff.path).toContain('developmentRegion');
    expect(diff.legacy).toBe('en');
    expect(diff.shim).toBe('fr');
  });

  it('catches a missing object via the isa histogram', () => {
    const a = {
      rootObject: hex(1),
      objects: {
        [hex(1)]: { isa: 'PBXProject', targets: [hex(2)] },
        [hex(2)]: { isa: 'PBXNativeTarget', name: 'App' },
      },
    };
    const b = { rootObject: hex(1), objects: { [hex(1)]: { isa: 'PBXProject', targets: [] } } };
    const diff = compareGraphs(a, b);
    expect(diff.equal).toBe(false);
    expect(diff.path).toContain('objectsByIsa');
  });

  it('terminates on reference cycles (containerPortal back to root)', () => {
    const mk = (base: number) => ({
      rootObject: hex(base),
      objects: {
        [hex(base)]: { isa: 'PBXProject', targets: [hex(base + 1)] },
        [hex(base + 1)]: { isa: 'PBXNativeTarget', dependencies: [hex(base + 2)] },
        [hex(base + 2)]: { isa: 'PBXTargetDependency', targetProxy: hex(base + 3) },
        [hex(base + 3)]: { isa: 'PBXContainerItemProxy', containerPortal: hex(base) },
      },
    });
    expect(compareGraphs(mk(1), mk(101))).toEqual({ equal: true });
  });

  it('compares UUID-keyed dicts (TargetAttributes) structurally', () => {
    const mk = (base: number) => ({
      rootObject: hex(base),
      objects: {
        [hex(base)]: {
          isa: 'PBXProject',
          targets: [hex(base + 1)],
          attributes: { TargetAttributes: { [hex(base + 1)]: { LastSwiftMigration: 1250 } } },
        },
        [hex(base + 1)]: { isa: 'PBXNativeTarget', name: 'App' },
      },
    });
    expect(compareGraphs(mk(1), mk(101))).toEqual({ equal: true });
  });
});

describe('compareSemantics (text → parse → compare)', () => {
  const base = build({
    archiveVersion: 1,
    objectVersion: 46,
    classes: {},
    rootObject: hex(1),
    objects: { [hex(1)]: { isa: 'PBXProject', myFlag: 'SAFE' } },
  });

  it('ignores quoting of safe values', () => {
    const quoted = base.replace('myFlag = SAFE;', 'myFlag = "SAFE";');
    expect(quoted).not.toBe(base);
    expect(compareSemantics(base, quoted)).toEqual({ equal: true });
  });

  it('catches a real value change', () => {
    const changed = base.replace('myFlag = SAFE;', 'myFlag = OTHER;');
    const diff = compareSemantics(base, changed);
    expect(diff.equal).toBe(false);
    expect(diff.path).toContain('myFlag');
  });
});

describe('compareResults', () => {
  it('matches results that differ only in UUID values', () => {
    expect(compareResults({ key: hex(1), name: 'App' }, { key: hex(99), name: 'App' })).toEqual({
      equal: true,
    });
  });

  it('catches a differing scalar', () => {
    expect(compareResults({ value: 'en' }, { value: 'fr' }).equal).toBe(false);
  });
});

describe('normalizedTextDiff', () => {
  it('reports lines unique to each side', () => {
    const r = normalizedTextDiff('a\nb\nc', 'a\nx\nc');
    expect(r.onlyLegacy).toEqual(['b']);
    expect(r.onlyShim).toEqual(['x']);
  });
});
