import {
  filterFeaturesByPlatforms,
  isComposeFeature,
  isSwiftUIFeature,
  resolveFeatures,
} from '../features';

describe('resolveFeatures', () => {
  it('returns empty array when no features provided in non-interactive mode', () => {
    expect(resolveFeatures([])).toEqual([]);
  });

  it('returns all features when fullExample is true', () => {
    const result = resolveFeatures([], true);
    expect(result).toContain('Function');
    expect(result).toContain('View');
    expect(result).toContain('SharedObject');
    expect(result).toContain('SwiftUIView');
    expect(result).toContain('ComposeView');
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

describe('filterFeaturesByPlatforms', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('keeps SwiftUI and Compose features when both platforms selected', () => {
    const result = filterFeaturesByPlatforms(['SwiftUIView', 'ComposeView'], ['apple', 'android']);
    expect(result).toEqual(['SwiftUIView', 'ComposeView']);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('drops SwiftUI features when apple is not selected', () => {
    const result = filterFeaturesByPlatforms(
      ['SwiftUIView', 'SwiftUIModifier', 'Function'],
      ['android']
    );
    expect(result).toEqual(['Function']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('SwiftUIView, SwiftUIModifier'));
  });

  it('drops Compose features when android is not selected', () => {
    const result = filterFeaturesByPlatforms(
      ['ComposeView', 'ComposeModifier', 'Function'],
      ['apple']
    );
    expect(result).toEqual(['Function']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ComposeView, ComposeModifier'));
  });

  it('keeps platform-agnostic features regardless of platforms', () => {
    const result = filterFeaturesByPlatforms(['Function', 'View', 'SharedObject'], ['apple']);
    expect(result).toEqual(['Function', 'View', 'SharedObject']);
    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe('feature classifiers', () => {
  it('isSwiftUIFeature identifies SwiftUI features', () => {
    expect(isSwiftUIFeature('SwiftUIView')).toBe(true);
    expect(isSwiftUIFeature('SwiftUIModifier')).toBe(true);
    expect(isSwiftUIFeature('ComposeView')).toBe(false);
    expect(isSwiftUIFeature('View')).toBe(false);
  });

  it('isComposeFeature identifies Compose features', () => {
    expect(isComposeFeature('ComposeView')).toBe(true);
    expect(isComposeFeature('ComposeModifier')).toBe(true);
    expect(isComposeFeature('SwiftUIView')).toBe(false);
    expect(isComposeFeature('View')).toBe(false);
  });
});
