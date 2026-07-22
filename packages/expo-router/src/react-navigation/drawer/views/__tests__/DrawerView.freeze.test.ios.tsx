import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { Screen as _Screen } from "react-native-screens";

import { Drawer } from "../../../../layouts/Drawer";
import { renderRouter } from "../../../../testing-library";
import type { DrawerNavigationOptions } from "../../types";

// `react-native-drawer-layout`'s `Drawer` needs reanimated, whose `/mock` entry is broken in this
// reanimated version — the setup mock falls back to `{}` and `useSharedValue` is undefined. Stub
// the drawer chrome to a passthrough that just renders the scene content; the freeze prop lives on
// the scene's rn-screens `Screen`, not the drawer chrome.
jest.mock("react-native-drawer-layout", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => children,
}));

// The drawer `MaybeScreen` gate (`screensEnabled()`) is truthy under the iOS jest preset, so it
// delegates to rn-screens' `Screen` — the prop capture point for the forwarded `freezeOnBlur`.
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

// Two routes so a blurred (inactive) scene renders alongside the focused one — the override must
// hold for both, which is where freeze would otherwise apply.
function renderDrawer(options?: DrawerNavigationOptions) {
  renderRouter({
    _layout: () => (
      <Drawer screenOptions={options}>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
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
    const calls = renderDrawer({ freezeOnBlur: true });

    expect(calls.length).toBeGreaterThan(1);
    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });

  it("forces freezeOnBlur off when no option is set", () => {
    const calls = renderDrawer();

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });
});
