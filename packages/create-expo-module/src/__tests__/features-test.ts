import { resolveFeatures } from '../features';

describe('resolveFeatures', () => {
  it('returns empty array when no features provided in non-interactive mode', () => {
    expect(resolveFeatures([])).toEqual([]);
  });

  it('returns all features when fullExample is true', () => {
    const result = resolveFeatures([], true);
    expect(result).toContain('Function');
    expect(result).toContain('View');
    expect(result).toContain('SharedObject');
  });

  it('auto-includes View when ViewEvent is selected', () => {
    const result = resolveFeatures(['ViewEvent']);
    expect(result).toContain('View');
    expect(result).toContain('ViewEvent');
  });

  it('does not duplicate View when both View and ViewEvent are selected', () => {
    const result = resolveFeatures(['View', 'ViewEvent']);
    expect(result.filter((f) => f === 'View')).toHaveLength(1);
  });

  it('ignores unknown feature names', () => {
    const result = resolveFeatures(['Function', 'Unknown']);
    expect(result).toEqual(['Function']);
    expect(result).not.toContain('Unknown');
  });
});
