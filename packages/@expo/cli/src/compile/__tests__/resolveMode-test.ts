import { resolveMode } from '../resolveMode';

describe(resolveMode, () => {
  it(`defaults to production`, () => {
    expect(() => resolveMode({})).toThrow(
      'Production builds are not supported yet. Pass --dev to build in development mode.'
    );
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

  it(`rejects --prod`, () => {
    expect(() => resolveMode({ prod: true })).toThrow(
      'Production builds are not supported yet. Pass --dev to build in development mode.'
    );
  });

  it(`rejects --prod with --device`, () => {
    expect(() => resolveMode({ prod: true, device: 'iPhone 18 Pro' })).toThrow(
      'Production builds are not supported yet. Pass --dev to build in development mode.'
    );
  });
});
