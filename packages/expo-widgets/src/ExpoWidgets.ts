import { NativeModule, requireNativeModule } from 'expo';

import { ExpoTimelineEntry, ExpoWidgetsEvents, LiveActivityInfo } from './Widgets.types';

declare class ExpoWidgetModule extends NativeModule<ExpoWidgetsEvents> {
  reloadWidget(name?: string): void;
  registerWidgetLayout(name: string, layout: string): void;
  updateWidgetTimeline(name: string, entries: ExpoTimelineEntry[]): void;
  registerLiveActivityLayout(name: string, layout: string): void;
  startLiveActivity(name: string, props: string, url?: string): string;
  updateLiveActivity(id: string, name: string, props: string): void;
  endLiveActivity(id: string, dismissalPolicy?: string): void;
  getLiveActivityPushToken(id: string): Promise<string | null>;
  getLiveActivities(): LiveActivityInfo[];
}

export default requireNativeModule<ExpoWidgetModule>('ExpoWidgets');
