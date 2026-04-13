import { buildDefaultsWarning } from '../utils/defaults';

describe('buildDefaultsWarning', () => {
  it('returns null when no defaults were used', () => {
    expect(buildDefaultsWarning([])).toBeNull();
  });

  it('contains the header line', () => {
    const result = buildDefaultsWarning([{ field: 'license', value: 'MIT' }]);
    expect(result).toMatch(/Warning: The following fields were not explicitly provided/);
  });

  it('contains the field name and its value', () => {
    const result = buildDefaultsWarning([{ field: 'license', value: 'MIT' }]);
    expect(result).toContain('license');
    expect(result).toContain('MIT');
  });

  it('shows (empty) for empty string values', () => {
    const result = buildDefaultsWarning([{ field: 'authorName', value: '' }]);
    expect(result).toContain('(empty)');
    expect(result).not.toContain('""');
  });

  it('aligns values so they all start at the same column', () => {
    const result = buildDefaultsWarning([
      { field: 'name', value: 'MyModule' },
      { field: 'authorName', value: 'Jane' },
    ])!;
    const lines = result.split('\n').slice(1, -1); // skip header and footer
    const col0 = lines[0].indexOf('MyModule');
    const col1 = lines[1].indexOf('Jane');
    expect(col0).toBe(col1);
  });

  it('contains the footer line', () => {
    const result = buildDefaultsWarning([{ field: 'license', value: 'MIT' }]);
    expect(result).toContain('provide all values explicitly via CLI flags');
  });

  it('lists every entry when multiple defaults are provided', () => {
    const result = buildDefaultsWarning([
      { field: 'license', value: 'MIT' },
      { field: 'version', value: '0.1.0' },
    ])!;
    expect(result).toContain('license');
    expect(result).toContain('version');
    expect(result).toContain('MIT');
    expect(result).toContain('0.1.0');
  });
});
