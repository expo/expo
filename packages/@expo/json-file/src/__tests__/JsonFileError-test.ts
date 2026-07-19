import JsonFileError from '../JsonFileError';

describe('JsonFileError', () => {
  it(`is an error`, () => {
    const error = new JsonFileError('Example');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof JsonFileError).toBe(true);
  });

  it(`has a flag that says it's a JsonFileError`, () => {
    const error = new JsonFileError('Example');
    expect(error.isJsonFileError).toBe(true);
  });

  it(`includes its cause`, () => {
    const cause = new Error('Root cause');
    const error = new JsonFileError('Example', cause);
    expect(error.cause).toBe(cause);
    expect(error.message).toMatch(cause.message);
  });
});
