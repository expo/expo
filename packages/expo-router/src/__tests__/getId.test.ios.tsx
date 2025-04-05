import { getSingularId } from '../useScreens';

describe(getSingularId, () => {
  it(`returns the context string when the route is not dynamic and there are no search params`, () => {
    expect(getSingularId('foo')).toBe('foo');
  });

  it(`ignores search params`, () => {
    expect(getSingularId('foo', { params: { foo: 'bar' } })).toBe('foo');
  });

  it(`picks dynamic params`, () => {
    expect(getSingularId('[foo]', { params: { foo: 'bar' } })).toBe('bar');
  });

  it(`picks catch-all dynamic name`, () => {
    expect(getSingularId('[...bacon]')).toBe('[...bacon]');

    // Matching param (ideal case)
    expect(getSingularId('[...bacon]', { params: { bacon: ['bacon', 'other'] } })).toBe(
      'bacon/other'
    );

    // With search parameters
    expect(getSingularId('[...bacon]', { params: { bar: 'foo' } })).toBe('[...bacon]');

    // Deep dynamic route
    expect(getSingularId('[...bacon]', { params: { bacon: ['foo', 'bar'] } })).toBe('foo/bar');
    expect(getSingularId('[...bacon]', { params: { bacon: ['foo'] } })).toBe('foo');

    // Should never happen, but just in case.
    expect(getSingularId('[...bacon]', { params: { bacon: [] } })).toBe('[...bacon]');
  });

  it(`returns a function that picks the dynamic name from params`, () => {
    expect(getSingularId('[user]')).toBe('[user]');

    // Matching param (ideal case)
    expect(getSingularId('[user]', { params: { user: 'bacon' } })).toBe('bacon');
    // With search parameters
    expect(getSingularId('[user]', { params: { bar: 'foo' } })).toBe('[user]');
    // No params
    expect(getSingularId('[user]', { params: undefined })).toBe('[user]');

    // Should never happen, but just in case.
    expect(getSingularId('[user]', { params: { user: '' } })).toBe('[user]');
  });

  it(`picks multiple dynamic names from params`, () => {
    expect(getSingularId('[user]/[bar]')).toBe('[user]/[bar]');

    expect(getSingularId('[user]/[bar]', { params: { user: 'bacon', bar: 'hey' } })).toBe(
      'bacon/hey'
    );
    // Fills partial params
    expect(getSingularId('[user]/[bar]', { params: { user: 'bacon' } })).toBe('bacon/[bar]');
    // With search parameters
    expect(getSingularId('[user]/[bar]', { params: { baz: 'foo' } })).toBe('[user]/[bar]');
    // No params
    expect(getSingularId('[user]/[bar]', { params: undefined })).toBe('[user]/[bar]');

    // Should never happen, but just in case.
    expect(getSingularId('[user]/[bar]', { params: { user: '' } })).toBe('[user]/[bar]');
  });
});
