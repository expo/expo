import ApiV2Error from '../ApiV2Error';

it(`works with instanceof`, () => {
  const error = new ApiV2Error('Testing');
  expect(error instanceof ApiV2Error).toBe(true);
});

it(`extends Error`, () => {
  const error = new ApiV2Error('Testing');
  expect(error instanceof Error).toBe(true);
});

it(`includes the error type when stringified`, () => {
  const error = new ApiV2Error('Testing');
  expect(`${error}`).toBe('ApiV2Error: Testing');
});
