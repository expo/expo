import { resolveMode } from '../resolveMode';

describe(resolveMode, () => {
  it(`defaults to production`, () => {
    expect(resolveMode({})).toBe('production');
  });

  it(`uses production for --prod with --device`, () => {
    expect(resolveMode({ prod: true, device: 'iPhone 18 Pro' })).toBe('production');
  });

  it(`uses development for --dev`, () => {
    expect(resolveMode({ dev: true })).toBe('development');
  });

  it(`uses development for --device`, () => {
    expect(resolveMode({ device: 'iPhone 18 Pro' })).toBe('development');
  });

  it(`rejects --dev with --prod`, () => {
    expect(() => resolveMode({ dev: true, prod: true })).toThrow(
      'Specify at most one of: --dev, --prod'
    );
  });
});
