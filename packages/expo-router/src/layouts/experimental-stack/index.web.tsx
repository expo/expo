'use client';
import type { ComponentProps } from 'react';

// On web, fall back to the standard Stack. The `.web` extension keeps the web
// bundle from importing `react-native-screens/experimental`, which is native-only.
import LegacyStack from '../Stack';

const ExperimentalStack = Object.assign(
  (props: ComponentProps<typeof LegacyStack>) => <LegacyStack {...props} />,
  {
    Screen: LegacyStack.Screen,
    Protected: LegacyStack.Protected,
  }
);

export { ExperimentalStack };

export default ExperimentalStack;

export type {
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationProp,
  ExperimentalStackScreenProps,
  ExperimentalStackNavigationHelpers,
} from './types';
