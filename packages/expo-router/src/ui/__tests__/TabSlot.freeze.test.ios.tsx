import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { Screen as _Screen } from "react-native-screens";

import { renderRouter } from "../../testing-library";
import { TabList, TabSlot, TabTrigger, Tabs } from "../index";
import type { TabsProps } from "../Tabs";

// `defaultTabsSlotRender` renders rn-screens' `Screen` directly and forwards `freezeOnBlur` from
// the tab descriptor options — that is the capture point.
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

// `lazy: false` so the unfocused (blurred) tab also renders a `Screen` — the override must hold
// for it too, which is where freeze would otherwise apply. (`defaultTabsSlotRender` returns null
// for an unvisited lazy tab.)
function renderTabs(freezeOnBlur?: boolean) {
  // `screenOptions` is typed `ExpoTabsScreenOptions` (requires `title`/`action`), but the runtime
  // only reads the `lazy`/`freezeOnBlur` extras off the descriptor — cast to pass just those.
  const screenOptions = (
    freezeOnBlur !== undefined ? { lazy: false, freezeOnBlur } : { lazy: false }
  ) as NonNullable<TabsProps["options"]>["screenOptions"];
  renderRouter({
    _layout: () => (
      <Tabs options={{ screenOptions }}>
        <TabList>
          <TabTrigger name="index" href="/">
            <Text>Index</Text>
          </TabTrigger>
          <TabTrigger name="second" href="/second">
            <Text>Second</Text>
          </TabTrigger>
        </TabList>
        <TabSlot />
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

  it("forces freezeOnBlur off on every tab even when a tab sets it on", () => {
    const calls = renderTabs(true);

    expect(calls.length).toBeGreaterThan(1);
    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });

  it("forces freezeOnBlur off when no option is set", () => {
    const calls = renderTabs();

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });
});
