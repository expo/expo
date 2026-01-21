import { ReactNode } from 'react';

export type WidgetFamily =
  | 'systemSmall'
  | 'systemMedium'
  | 'systemLarge'
  | 'systemExtraLarge'
  | 'accessoryCircular'
  | 'accessoryRectangular'
  | 'accessoryInline';

export type WidgetDimensions = { width: number; height: number };

export type WidgetProps<T extends object> = {
  date: Date;
  family: WidgetFamily;
} & T;

export type ExpoTimelineEntry = {
  timestamp: number;
  content: ReactNode;
};

export type ExpoLiveActivityEntry = {
  banner: ReactNode;
  compactLeading?: ReactNode;
  compactTrailing?: ReactNode;
  minimal?: ReactNode;
  expandedCenter?: ReactNode;
  expandedLeading?: ReactNode;
  expandedTrailing?: ReactNode;
  expandedBottom?: ReactNode;
};

export type LiveActivityComponent = () => ExpoLiveActivityEntry;

export type UserInteractionEvent = {
  source: string;
  target: string;
  timestamp: number;
  type: 'ExpoWidgetsUserInteraction';
};

export type ExpoWidgetsEvents = {
  onUserInteraction: (event: UserInteractionEvent) => void;
};
