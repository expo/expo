/// <reference types="jest-expo/rsc/expect" />

import TopTabs, {
  MaterialTopTabBar,
  MaterialTopTabView,
  createStandardMaterialTopTabNavigator,
  useTabAnimation,
} from '../TopTabs';

// The module proxy answers any property name, so `toBeDefined()` would pass even for a dropped
// export. Assert the client-reference marker to pin that these crossed a client boundary.
function expectClientReference(value: unknown) {
  expect((value as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.client.reference'));
}

it('resolves React Navigation exports as client references', () => {
  expectClientReference(createStandardMaterialTopTabNavigator);
  expectClientReference(MaterialTopTabBar);
  expectClientReference(MaterialTopTabView);
  expectClientReference(useTabAnimation);
});

it(`renders TopTabs`, async () => {
  await expect(<TopTabs />).toMatchFlightSnapshot();
});

it(`renders TopTabs.Screen`, async () => {
  await expect(<TopTabs.Screen options={{ title: '...' }} />).toMatchFlightSnapshot();
});

it(`renders TopTabs.Protected`, async () => {
  await expect(<TopTabs.Protected guard={false} />).toMatchFlightSnapshot();
});
