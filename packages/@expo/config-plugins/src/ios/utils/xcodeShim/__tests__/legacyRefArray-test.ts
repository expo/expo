import { legacyRefArray } from '../legacyRefArray';

function makeProject() {
  const registry = new Map<string, any>();
  const project: any = {
    getObject(uuid: string) {
      if (!registry.has(uuid)) throw new Error(`missing ${uuid}`);
      return registry.get(uuid);
    },
  };
  const add = (uuid: string, name: string) => {
    const model = { uuid, isa: 'PBXFileReference', getDisplayName: () => name };
    registry.set(uuid, model);
    return model;
  };
  return { project, add };
}

describe('legacyRefArray', () => {
  it('projects backing models to { value, comment } on read', () => {
    const { project, add } = makeProject();
    const arr = legacyRefArray([add('AAA', 'A.swift'), add('BBB', 'B.swift')], project);
    expect(arr.length).toBe(2);
    expect(arr[0]).toEqual({ value: 'AAA', comment: 'A.swift' });
    expect(arr.map((e) => e.value)).toEqual(['AAA', 'BBB']);
    expect(arr.find((e) => e.comment === 'B.swift')).toEqual({ value: 'BBB', comment: 'B.swift' });
    expect(arr.some((e) => e.comment === 'A.swift')).toBe(true);
    expect([...arr]).toEqual([
      { value: 'AAA', comment: 'A.swift' },
      { value: 'BBB', comment: 'B.swift' },
    ]);
  });

  it('push writes through to the backing as a model instance', () => {
    const { project, add } = makeProject();
    const backing: any[] = [];
    add('CCC', 'C.swift');
    const arr = legacyRefArray(backing, project);
    arr.push({ value: 'CCC', comment: 'C.swift' });
    expect(backing).toHaveLength(1);
    expect(backing[0].uuid).toBe('CCC');
    expect(arr[0]).toEqual({ value: 'CCC', comment: 'C.swift' });
  });

  it('is never stale: reflects backing mutations made by another path', () => {
    const { project, add } = makeProject();
    const backing = [add('AAA', 'A')];
    const arr = legacyRefArray(backing, project);
    expect(arr.length).toBe(1);
    backing.push(add('BBB', 'B'));
    expect(arr.length).toBe(2);
    expect(arr[1]).toEqual({ value: 'BBB', comment: 'B' });
  });

  it('splice removes from the backing and returns projected entries', () => {
    const { project, add } = makeProject();
    const backing = [add('AAA', 'A'), add('BBB', 'B'), add('CCC', 'C')];
    const arr = legacyRefArray(backing, project);
    expect(arr.splice(1, 1)).toEqual([{ value: 'BBB', comment: 'B' }]);
    expect(backing.map((m) => m.uuid)).toEqual(['AAA', 'CCC']);
  });

  it('index assignment writes through', () => {
    const { project, add } = makeProject();
    const backing = [add('AAA', 'A')];
    add('ZZZ', 'Z');
    const arr = legacyRefArray(backing, project);
    arr[0] = { value: 'ZZZ', comment: 'Z' };
    expect(backing[0].uuid).toBe('ZZZ');
  });

  it('tolerates linking a not-yet-registered reference (legacy behavior)', () => {
    const { project } = makeProject();
    const backing: any[] = [];
    const arr = legacyRefArray(backing, project);
    arr.push({ value: 'NOPE', comment: 'x' });
    // A stand-in carrying the uuid is stored so serialization emits the reference.
    expect(backing[0].uuid).toBe('NOPE');
    expect(arr[0]).toEqual({ value: 'NOPE', comment: 'x' });
  });

  it('throws on unsupported mutators rather than silently dropping writes', () => {
    const { project, add } = makeProject();
    const arr = legacyRefArray([add('AAA', 'A')], project);
    expect(() => (arr as any).pop()).toThrow(/not supported/);
  });

  it('reports Array.isArray true', () => {
    const { project } = makeProject();
    expect(Array.isArray(legacyRefArray([], project))).toBe(true);
  });
});
