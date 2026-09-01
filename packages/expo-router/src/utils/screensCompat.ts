import type { ComponentType, PropsWithChildren } from 'react';

import type { SplitHostProps } from '../split-view/types';

type StackModule = {
  Host: ComponentType<PropsWithChildren>;
  Screen: ComponentType<
    PropsWithChildren<{
      activityMode: 'attached' | 'detached';
      screenKey: string;
      preventNativeDismiss: boolean;
      onWillAppear: () => void;
      onWillDisappear: () => void;
      onDidAppear: () => void;
      onDidDisappear: () => void;
      onNativeDismiss: (screenKey: string) => void;
      onNativeDismissPrevented: () => void;
    }>
  >;
  HeaderConfig: ComponentType<{
    title?: string;
    hidden?: boolean;
    transparent?: boolean;
    backButtonHidden?: boolean;
  }>;
};

type SplitModule = {
  Host: ComponentType<SplitHostProps>;
  Column: ComponentType<PropsWithChildren>;
  Inspector: ComponentType<PropsWithChildren>;
};

type ScreensModule = {
  Stack?: StackModule;
  Split?: SplitModule;
};

const screens: ScreensModule = require('react-native-screens');

function getExperimentalScreens(): ScreensModule {
  return require('react-native-screens/experimental');
}

export const StackV5 = screens.Stack ?? getExperimentalScreens().Stack!;
export const Split = screens.Split ?? getExperimentalScreens().Split!;
