import * as React from 'react';
import { View } from 'react-native';

export type BlurProps = {
  tint: BlurTint;
  intensity: number;
} & React.ComponentProps<typeof View>;

export type BlurTint = 'light' | 'dark' | 'default';

export type ComponentOrHandle =
  | null
  | number
  | React.Component<any, any>
  | React.ComponentClass<any>;
