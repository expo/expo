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
  /**
   * When `true`, a child percentage is a fraction of this column.
   * Universal `Column` sets this. Leave it unset to keep the Compose `Column`.
   */
  resolvesChildPercentages?: boolean;
  /**
   * When `true` with `resolvesChildPercentages`, this column uses the percentage layout.
   * Universal `Column` sets this only when it or a child has a percentage size.
   * @hidden
   */
  usesPercentageLayout?: boolean;
}

const ColumnNativeView: React.ComponentType<ColumnProps> = requireNativeView(
  'ExpoUI',
  'ColumnView'
);

export function Column(props: ColumnProps) {
  return <ColumnNativeView {...transformProps(props)} />;
}
