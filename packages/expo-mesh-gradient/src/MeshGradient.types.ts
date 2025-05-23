import type { ColorValue, ViewProps } from 'react-native';

export interface MeshGradientViewProps extends ViewProps {
  /**
   * Width of the mesh, i.e. the number of vertices per row.
   * @default 0
   */
  columns?: number;

  /**
   * Height of the mesh, i.e. the number of vertices per column.
   * @default 0
   */
  rows?: number;

  /**
   * An array of two-dimensional points on the mesh. Must contain `columns * rows` elements.
   * @default []
   */
  points?: number[][];

  /**
   * An array of colors. Must contain `columns * rows` elements.
   * @default []
   */
  colors?: ColorValue[];

  /**
   * Whether cubic (smooth) interpolation should be used for the colors in the mesh
   * rather than only for the shape of the mesh.
   * @default true
   */
  smoothsColors?: boolean;

  /**
   * Whether to ignore safe areas when positioning the view.
   * @default true
   * @platform ios
   */
  ignoresSafeArea?: boolean;

  /**
   * Masks the gradient using the alpha channel of the given children views.
   * > **Note**: When this option is enabled, all user interactions (gestures) on children views are ignored.
   * @default false
   * @platform ios
   */
  mask?: boolean;

  /**
   * Specifies how many points to sample on the path between points.
   * @default { x: 1, y: 1 }
   * @platform android
   */
  resolution?: {
    x?: number;
    y?: number;
  };
}
