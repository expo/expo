import ApiV2Error from 'ApiV2Error';

it(`works with instanceof`, () => {
  let error = new ApiV2Error('Testing');
  expect(error instanceof ApiV2Error).toBe(true);
});

it(`extends Error`, () => {
  let error = new ApiV2Error('Testing');
  expect(error instanceof Error).toBe(true);
});

it(`includes the error type when stringified`, () => {
  let error = new ApiV2Error('Testing');
  expect(`${error}`).toBe('ApiV2Error: Testing');
});
