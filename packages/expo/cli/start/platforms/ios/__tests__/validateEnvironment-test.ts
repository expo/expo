import { validateEnvironmentAsync } from '../validateEnvironment';

describe(validateEnvironmentAsync, () => {
  it(`does not throw when the system requirements are present`, async () => {
    await validateEnvironmentAsync();
  });
});
