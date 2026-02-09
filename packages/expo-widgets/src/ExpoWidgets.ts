import { NativeModule, requireNativeModule } from 'expo';

import { ExpoTimelineEntry, ExpoWidgetsEvents, LiveActivityInfo } from './Widgets.types';

declare class ExpoWidgetModule extends NativeModule<ExpoWidgetsEvents> {
  reloadWidget(name?: string): void;
  registerWidgetLayout(name: string, layout: string): void;
  updateWidgetTimeline(name: string, entries: ExpoTimelineEntry[]): void;
  registerLiveActivityLayout(name: string, layout: string): void;
  startLiveActivity(name: string, props: object | undefined, url?: string): string;
  updateLiveActivity(id: string, name: string, props: object | undefined): void;
  endLiveActivity(id: string, dismissalPolicy?: string): void;
  getLiveActivityPushToken(id: string): Promise<string | null>;
  getLiveActivities(): LiveActivityInfo[];
}

export default requireNativeModule<ExpoWidgetModule>('ExpoWidgets');
