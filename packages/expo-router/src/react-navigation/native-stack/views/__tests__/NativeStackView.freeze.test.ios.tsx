import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { ScreenStackItem as _ScreenStackItem } from "react-native-screens";

import Stack from "../../../../layouts/StackClient";
import { renderRouter } from "../../../../testing-library";
import type { NativeStackNavigationOptions } from "../../types";

jest.mock("react-native-screens", () => {
  const actualScreens = jest.requireActual(
    "react-native-screens",
  ) as typeof import("react-native-screens");
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => (
      <actualScreens.ScreenStackItem {...props} />
    )),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<
  typeof _ScreenStackItem
>;

function renderStack(options?: NativeStackNavigationOptions) {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={options} />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId("index")).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalled();
  return ScreenStackItem.mock.calls.map((call) => call[0]);
}

describe("freezeOnBlur override", () => {
  beforeEach(() => {
    ScreenStackItem.mockClear();
  });

  it("forces freezeOnBlur off even when the screen sets it on", () => {
    const calls = renderStack({ freezeOnBlur: true });

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });

  it("forces freezeOnBlur off when no option is set", () => {
    const calls = renderStack();

    expect(calls.every((props) => props.freezeOnBlur === false)).toBe(true);
  });

  it("still lets unstable_nativeProps re-enable freeze (advanced escape hatch)", () => {
    const calls = renderStack({
      unstable_nativeProps: { freezeOnBlur: true },
    });

    expect(calls.every((props) => props.freezeOnBlur === true)).toBe(true);
  });
});
