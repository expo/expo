/// <reference types="jest-expo/rsc/expect" />

import Tabs, {
  BottomTabBar,
  BottomTabBarHeightCallbackContext,
  BottomTabBarHeightContext,
  BottomTabView,
  SceneStyleInterpolators,
  TransitionPresets,
  TransitionSpecs,
  createStandardBottomTabNavigator,
  useBottomTabBarHeight,
} from '../Tabs';

function expectClientReference(value: unknown) {
  expect((value as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.client.reference'));
}

it('resolves React Navigation exports as client references', () => {
  expectClientReference(createStandardBottomTabNavigator);
  expectClientReference(BottomTabBar);
  expectClientReference(BottomTabView);
  expectClientReference(BottomTabBarHeightCallbackContext);
  expectClientReference(BottomTabBarHeightContext);
  expectClientReference(useBottomTabBarHeight);
});

it('resolves transition namespaces on the server', () => {
  expect(TransitionPresets.ShiftTransition).toBeDefined();
  const fadeConfig = TransitionSpecs.FadeSpec.config as { easing?: unknown };
  expect(fadeConfig).toMatchObject({ duration: 150 });
  if (process.env.EXPO_OS === 'web') {
    // react-native-web's `Easing` works on the server.
    expect(fadeConfig.easing).toBeInstanceOf(Function);
  } else {
    // On native, `easing` still needs the client — `Easing` is only resolved when read.
    expect(() => fadeConfig.easing).toThrow();
  }
  expect(SceneStyleInterpolators.forFade).toBeInstanceOf(Function);
});

it(`renders Tabs`, async () => {
  await expect(<Tabs />).toMatchFlightSnapshot();
});

it(`renders Tabs.Screen`, async () => {
  await expect(<Tabs.Screen options={{ title: '...' }} />).toMatchFlightSnapshot();
});

it(`renders Tabs.Protected`, async () => {
  await expect(<Tabs.Protected guard={false} />).toMatchFlightSnapshot();
});
