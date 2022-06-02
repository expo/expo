import { Prerequisite, PrerequisiteCommandError } from '../Prerequisite';

describe(PrerequisiteCommandError, () => {
  it(`prepends code`, () => {
    const error = new PrerequisiteCommandError('TEST', 'message');
    expect(error.code).toBe('VALIDATE_TEST');
    expect(error.message).toBe('message');
  });
  it(`does not change message when no code is provided`, () => {
    const error = new PrerequisiteCommandError('message');
    expect(error.message).toBe('message');
  });
});

describe(Prerequisite, () => {
  it(`memoizes assertion`, async () => {
    const prerequisite = new Prerequisite();
    const assertAsync = jest.fn(() => Promise.resolve());
    prerequisite.assertImplementation = assertAsync;
    prerequisite.resetAssertion();
    await prerequisite.assertAsync();
    expect(assertAsync).toHaveBeenCalledTimes(1);
    await prerequisite.assertAsync();
    expect(assertAsync).toHaveBeenCalledTimes(1);

    // Respect reset.
    prerequisite.resetAssertion();
    await prerequisite.assertAsync();
    expect(assertAsync).toHaveBeenCalledTimes(2);
  });

  it(`caches prerequisite assertion`, async () => {
    const prerequisite = new Prerequisite();
    const assertAsync = jest.fn(async () => {
      throw new PrerequisiteCommandError('foobar');
    });
    prerequisite.assertImplementation = assertAsync;
    prerequisite.resetAssertion();
    await expect(prerequisite.assertAsync()).rejects.toThrowError(PrerequisiteCommandError);
    expect(assertAsync).toHaveBeenCalledTimes(1);
    // Continues to throw the same error without trying again.
    await expect(prerequisite.assertAsync()).rejects.toThrowError(PrerequisiteCommandError);
    expect(assertAsync).toHaveBeenCalledTimes(1);
  });
});
