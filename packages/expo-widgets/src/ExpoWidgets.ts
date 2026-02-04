import { NativeModule, requireNativeModule } from 'expo';

import { ExpoWidgetsEvents, LiveActivityInfo } from './Widgets.types';

declare class ExpoWidgetModule extends NativeModule<ExpoWidgetsEvents> {
  reloadWidget(timeline?: string): void;
  updateWidget(
    name: string,
    data: string,
    props?: Record<string, any>,
    updateFunction?: string
  ): void;
  startLiveActivity(name: string, nodes: string, url?: string): string;
  updateLiveActivity(id: string, name: string, nodes: string): void;
  endLiveActivity(id: string, dismissalPolicy?: string): void;
  getLiveActivityPushToken(id: string): Promise<string | null>;
  getLiveActivities(): LiveActivityInfo[];
}

export default requireNativeModule<ExpoWidgetModule>('ExpoWidgets');
