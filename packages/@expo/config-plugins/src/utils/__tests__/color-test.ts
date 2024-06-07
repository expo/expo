import { convertColor } from '../color';

jest.mock('resolve-from', () => {
  const path = jest.requireActual('path');
  const expoRoot = path.resolve(__dirname, '../../../../../..');
  return {
    // Try to resolve packages from workspace root because all packages are hoisted to the root
    silent: jest.fn().mockImplementation((projectRoot: string, packageName: string) => {
      return path.join(expoRoot, 'node_modules', packageName);
    }),
  };
});

describe(convertColor, () => {
  it('should convert color in hex string', () => {
    expect(convertColor('/app', '#ff0000')).toBe(0xffff0000);
    expect(convertColor('/app', '#ff000080')).toBe(0x80ff0000);
  });

  it('should convert color in rgb/rgba function', () => {
    expect(convertColor('/app', 'rgb(255, 0, 0)')).toBe(0xffff0000);
    expect(convertColor('/app', 'rgba(255, 0, 0, 0.5)')).toBe(0x80ff0000);
  });

  it('should convert named color', () => {
    expect(convertColor('/app', 'red')).toBe(0xffff0000);
    expect(convertColor('/app', 'green')).toBe(0xff008000);
    expect(convertColor('/app', 'blue')).toBe(0xff0000ff);
  });

  it('should throw an error for invalid color', () => {
    expect(() => convertColor('/app', 'invalid')).toThrow();
  });
});
