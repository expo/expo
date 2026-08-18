export const WidgetFamily = {
  systemSmall: 'systemSmall',
  systemMedium: 'systemMedium',
  systemLarge: 'systemLarge',
  systemExtraLarge: 'systemExtraLarge',
  accessoryCircular: 'accessoryCircular',
  accessoryRectangular: 'accessoryRectangular',
  accessoryInline: 'accessoryInline',
} as const;

export type WidgetFamily = (typeof WidgetFamily)[keyof typeof WidgetFamily];
