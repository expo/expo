import { requireNativeView } from 'expo';

import {
  type HorizontalAlignment,
  type HorizontalArrangement,
  type PrimitiveBaseProps,
  type VerticalAlignment,
  type VerticalArrangement,
  transformProps,
} from '../layout-types';

export interface RowProps extends PrimitiveBaseProps {
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

const RowNativeView: React.ComponentType<RowProps> = requireNativeView('ExpoUI', 'RowView');

export function Row(props: RowProps) {
  return <RowNativeView {...transformProps(props)} />;
}
