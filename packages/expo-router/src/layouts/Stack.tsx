import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";

import { withLayoutContext } from "./withLayoutContext";

const NativeStackNavigator = createNativeStackNavigator().Navigator;

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof NativeStackNavigator
>(NativeStackNavigator);

export default Stack;
