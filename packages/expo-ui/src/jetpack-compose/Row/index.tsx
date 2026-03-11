import { requireNativeView } from 'expo';

import {
  HorizontalAlignment,
  HorizontalArrangement,
  PrimitiveBaseProps,
  VerticalAlignment,
  VerticalArrangement,
  transformProps,
} from '../layout-types';

export type RowProps = {
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

const RowNativeView: React.ComponentType<RowProps> = requireNativeView('ExpoUI', 'RowView');

export function Row(props: RowProps) {
  return <RowNativeView {...transformProps(props)} />;
}
