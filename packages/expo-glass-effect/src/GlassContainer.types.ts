import { ViewProps } from 'react-native';

export type GlassContainerProps = {
  /**
   * The distance at which glass elements start affecting each other.
   * Controls when glass elements begin to merge together.
   * @default undefined
   */
  spacing?: number;
} & ViewProps;
