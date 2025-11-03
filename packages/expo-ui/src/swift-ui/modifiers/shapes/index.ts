export const shapes = {
  roundedRectangle: (params: {
    cornerRadius?: number;
    roundedCornerStyle?: 'continuous' | 'circular';
    cornerSize?: { width: number; height: number };
  }) => ({
    cornerRadius: params.cornerRadius,
    roundedCornerStyle: params.roundedCornerStyle,
    cornerSize: params.cornerSize,
    shape: 'roundedRectangle',
  }),
  capsule: (params?: { roundedCornerStyle?: 'continuous' | 'circular' }) => ({
    roundedCornerStyle: params?.roundedCornerStyle,
    shape: 'capsule',
  }),
  rectangle: () => ({
    shape: 'rectangle',
  }),
  ellipse: () => ({
    shape: 'ellipse',
  }),
  circle: () => ({
    shape: 'circle',
  }),
};

export type Shape =
  | ReturnType<typeof shapes.roundedRectangle>
  | ReturnType<typeof shapes.capsule>
  | ReturnType<typeof shapes.rectangle>
  | ReturnType<typeof shapes.ellipse>
  | ReturnType<typeof shapes.circle>;
