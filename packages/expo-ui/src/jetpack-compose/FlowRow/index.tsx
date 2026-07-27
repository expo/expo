import { requireNativeView } from 'expo';

import {
  type HorizontalArrangement,
  type PrimitiveBaseProps,
  type VerticalArrangement,
  transformProps,
} from '../layout-types';

export interface FlowRowProps extends PrimitiveBaseProps {
  children?: React.ReactNode;
  /**
   * Horizontal arrangement of children.
   */
  horizontalArrangement?: HorizontalArrangement;
  /**
   * Vertical arrangement of children.
   */
  verticalArrangement?: VerticalArrangement;
}

const FlowRowNativeView: React.ComponentType<FlowRowProps> = requireNativeView(
  'ExpoUI',
  'FlowRowView'
);

export function FlowRow(props: FlowRowProps) {
  return <FlowRowNativeView {...transformProps(props)} />;
}
