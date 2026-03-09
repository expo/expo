import { requireNativeView } from 'expo';

import {
  HorizontalAlignment,
  HorizontalArrangement,
  PrimitiveBaseProps,
  VerticalAlignment,
  VerticalArrangement,
  transformProps,
} from '../layout-types';

export type ColumnProps = {
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
} & PrimitiveBaseProps;

const ColumnNativeView: React.ComponentType<ColumnProps> = requireNativeView(
  'ExpoUI',
  'ColumnView'
);

export function Column(props: ColumnProps) {
  return <ColumnNativeView {...transformProps(props)} />;
}
