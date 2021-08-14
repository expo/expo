/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  NotFound: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type RootTabParamList = {
  TabOne: NavigatorScreenParams<TabOneParamList> | undefined;
  TabTwo: NavigatorScreenParams<TabTwoParamList> | undefined;
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;

export type TabOneParamList = {
  TabOneScreen: undefined;
};

export type TabOneScreenProps<Screen extends keyof TabOneParamList> = CompositeScreenProps<
  NativeStackScreenProps<TabOneParamList, Screen>,
  BottomTabScreenProps<RootTabParamList>
>;

export type TabTwoParamList = {
  TabTwoScreen: undefined;
};

export type TabTwoScreenProps<Screen extends keyof TabTwoParamList> = CompositeScreenProps<
  NativeStackScreenProps<TabTwoParamList, Screen>,
  BottomTabScreenProps<RootTabParamList>
>;
