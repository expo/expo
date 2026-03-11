import { requireNativeView } from 'expo';

import {
  HorizontalArrangement,
  PrimitiveBaseProps,
  VerticalArrangement,
  transformProps,
} from '../layout-types';

export type FlowRowProps = {
  children?: React.ReactNode;
  /**
   * Horizontal arrangement of children.
   */
  horizontalArrangement?: HorizontalArrangement;
  /**
   * Vertical arrangement of children.
   */
  verticalArrangement?: VerticalArrangement;
} & PrimitiveBaseProps;

const FlowRowNativeView: React.ComponentType<FlowRowProps> = requireNativeView(
  'ExpoUI',
  'FlowRowView'
);

export function FlowRow(props: FlowRowProps) {
  return <FlowRowNativeView {...transformProps(props)} />;
}
