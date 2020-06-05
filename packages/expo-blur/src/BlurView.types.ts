import { ViewProps } from 'react-native';

export type BlurProps = {
  tint: BlurTint;
  intensity: number;
} & ViewProps;

export type BlurTint = 'light' | 'dark' | 'default';

export type ComponentOrHandle =
  | null
  | number
  | React.Component<any, any>
  | React.ComponentClass<any>;
