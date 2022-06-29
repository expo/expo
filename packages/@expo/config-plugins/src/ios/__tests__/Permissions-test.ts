import { applyPermissions } from '../Permissions';

describe(applyPermissions, () => {
  it(`applies permissions`, () => {
    expect(
      applyPermissions(
        {
          foo: 'USE FOO',
          bar: 'USE BAR',
          sigma: 'USE SIGMA',
        },
        {
          // @ts-expect-error
          skip: 'invalid',
          sigma: false,
        },
        { foo: 'bar', sigma: 'defined' }
      )
    ).toStrictEqual({ foo: 'bar', bar: 'USE BAR' });
  });
});
