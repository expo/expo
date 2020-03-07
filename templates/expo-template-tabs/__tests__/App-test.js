import * as React from "react";
import { act, create } from "react-test-renderer";
import App from "../App";

// mocks expo related configuration
jest.mock("expo", () => ({
  AppLoading: "AppLoading",
  Linking: {
    makeUrl: () => "/"
  }
}));

// mocks navigation component
jest.mock("../navigation/BottomTabNavigator", () => "BottomTabNavigator");

describe("App", () => {
  jest.useFakeTimers();
  let tree;
  it(`renders correctly`, () => {
    act(() => {
      tree = create(<App skipLoadingScreen/>);
    });
    expect(tree.toJSON()).toMatchSnapshot();
  });
});