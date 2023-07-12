import { unsafeTemplate } from '../template';

describe(unsafeTemplate, () => {
  it('can use positional arguments', () => {
    const template = unsafeTemplate`${0}${1}${0}!`;
    expect(template('Y', 'A')).toBe('YAY!');
  });

  it('can use named arguments', () => {
    const template = unsafeTemplate`${0} ${'foo'}!`;
    expect(template('Hello', { foo: 'World' })).toBe('Hello World!');
  });
});
