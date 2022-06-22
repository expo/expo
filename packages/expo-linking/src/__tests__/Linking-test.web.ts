import * as Linking from '../Linking';

describe(Linking.addEventListener, () => {
  it(`returns the expected subscription`, () => {
    const subscription = Linking.addEventListener('url', jest.fn());
    // NOTE(EvanBacon): This test ensures that the web and native implementations return the same subscription.
    subscription.remove();
  });
});
