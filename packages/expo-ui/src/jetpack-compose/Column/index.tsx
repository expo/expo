import { requireNativeView } from 'expo';

import {
  type HorizontalAlignment,
  type HorizontalArrangement,
  type PrimitiveBaseProps,
  type VerticalAlignment,
  type VerticalArrangement,
  transformProps,
} from '../layout-types';

export interface ColumnProps extends PrimitiveBaseProps {
  children?: React.ReactNode;
  /**
   * Horizontal arrangement of children.
   */
  horizontalArrangement?: HorizontalArrangement;
  /**
   * Vertical arrangement of children.
   */
  verticalArrangement?: VerticalArrangement;
  /**
   * Horizontal alignment of children.
   */
  horizontalAlignment?: HorizontalAlignment;
  /**
   * Vertical alignment of children.
   */
  verticalAlignment?: VerticalAlignment;
}

const ColumnNativeView: React.ComponentType<ColumnProps> = requireNativeView(
  'ExpoUI',
  'ColumnView'
);

export function Column(props: ColumnProps) {
  return <ColumnNativeView {...transformProps(props)} />;
}
