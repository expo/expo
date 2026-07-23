import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { Screen as _Screen } from "react-native-screens";

import { Tabs } from "../../../../layouts/Tabs";
import { renderRouter } from "../../../../testing-library";
import type { BottomTabNavigationOptions } from "../../types";

// Under the iOS jest preset `screensEnabled()` is true, so `MaybeScreen` delegates to
// rn-screens' `Screen` — that is the prop capture point for the forwarded `freezeOnBlur`.
jest.mock("react-native-screens", () => {
  const actualScreens = jest.requireActual(
    "react-native-screens",
  ) as typeof import("react-native-screens");
  return {
    ...actualScreens,
    Screen: jest.fn((props) => <actualScreens.Screen {...props} />),
  };
});

const Screen = _Screen as jest.MockedFunction<typeof _Screen>;

// Two tabs so a blurred (inactive) scene renders alongside the focused one — the override must
// hold for both, which is where freeze would otherwise apply.
function renderTabs(options?: BottomTabNavigationOptions) {
  renderRouter({
    _layout: () => (
      <Tabs screenOptions={options}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  expect(screen.getByTestId("index")).toBeVisible();
  expect(Screen).toHaveBeenCalled();
  return Screen.mock.calls.map((call) => call[0]);
}

describe("freezeOnBlur override", () => {
  beforeEach(() => {
    Screen.mockClear();
  });

  it("forces freezeOnBlur off on every scene even when the screen sets it on", () => {
    const calls = renderTabs({ freezeOnBlur: true });

    expect(calls.length).toBeGreaterThan(1);
    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });

  it("forces freezeOnBlur off when no option is set", () => {
    const calls = renderTabs();

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });
});
