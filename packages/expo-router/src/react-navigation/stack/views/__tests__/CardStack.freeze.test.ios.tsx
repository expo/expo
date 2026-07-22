import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { Screen as _Screen } from "react-native-screens";

import Stack from "../../../../layouts/JSStack";
import { renderRouter } from "../../../../testing-library";
import type { StackNavigationOptions } from "../../types";

// The JS-stack `MaybeScreen` gate is `Screens != null` (truthy when rn-screens is installed), so
// it delegates to rn-screens' `Screen` — the prop capture point for the forwarded `freezeOnBlur`.
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

function renderStack(options?: StackNavigationOptions) {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={options} />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId("index")).toBeVisible();
  expect(Screen).toHaveBeenCalled();
  return Screen.mock.calls.map((call) => call[0]);
}

describe("freezeOnBlur override", () => {
  beforeEach(() => {
    Screen.mockClear();
  });

  it("forces freezeOnBlur off even when the screen sets it on", () => {
    const calls = renderStack({ freezeOnBlur: true });

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });

  it("forces freezeOnBlur off when no option is set", () => {
    const calls = renderStack();

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });
});
