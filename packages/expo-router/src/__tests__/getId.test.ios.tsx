import { getUniqueId } from '../useScreens';

describe(getUniqueId, () => {
  it(`returns the context string when the route is not dynamic and there are no search params`, () => {
    expect(getUniqueId('foo')).toBe('foo');
  });

  it(`ignores search params`, () => {
    expect(getUniqueId('foo', { params: { foo: 'bar' } })).toBe('foo');
  });

  it(`picks dynamic params`, () => {
    expect(getUniqueId('[foo]', { params: { foo: 'bar' } })).toBe('bar');
  });

  it(`picks catch-all dynamic name`, () => {
    expect(getUniqueId('[...bacon]')).toBe('[...bacon]');

    // Matching param (ideal case)
    expect(getUniqueId('[...bacon]', { params: { bacon: ['bacon', 'other'] } })).toBe(
      'bacon/other'
    );

    // With search parameters
    expect(getUniqueId('[...bacon]', { params: { bar: 'foo' } })).toBe('[...bacon]');

    // Deep dynamic route
    expect(getUniqueId('[...bacon]', { params: { bacon: ['foo', 'bar'] } })).toBe('foo/bar');
    expect(getUniqueId('[...bacon]', { params: { bacon: ['foo'] } })).toBe('foo');

    // Should never happen, but just in case.
    expect(getUniqueId('[...bacon]', { params: { bacon: [] } })).toBe('[...bacon]');
  });

  it(`returns a function that picks the dynamic name from params`, () => {
    expect(getUniqueId('[user]')).toBe('[user]');

    // Matching param (ideal case)
    expect(getUniqueId('[user]', { params: { user: 'bacon' } })).toBe('bacon');
    // With search parameters
    expect(getUniqueId('[user]', { params: { bar: 'foo' } })).toBe('[user]');
    // No params
    expect(getUniqueId('[user]', { params: undefined })).toBe('[user]');

    // Should never happen, but just in case.
    expect(getUniqueId('[user]', { params: { user: '' } })).toBe('[user]');
  });

  it(`picks multiple dynamic names from params`, () => {
    expect(getUniqueId('[user]/[bar]')).toBe('[user]/[bar]');

    expect(getUniqueId('[user]/[bar]', { params: { user: 'bacon', bar: 'hey' } })).toBe(
      'bacon/hey'
    );
    // Fills partial params
    expect(getUniqueId('[user]/[bar]', { params: { user: 'bacon' } })).toBe('bacon/[bar]');
    // With search parameters
    expect(getUniqueId('[user]/[bar]', { params: { baz: 'foo' } })).toBe('[user]/[bar]');
    // No params
    expect(getUniqueId('[user]/[bar]', { params: undefined })).toBe('[user]/[bar]');

    // Should never happen, but just in case.
    expect(getUniqueId('[user]/[bar]', { params: { user: '' } })).toBe('[user]/[bar]');
  });
});
