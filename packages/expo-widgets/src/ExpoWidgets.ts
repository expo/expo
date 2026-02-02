import { NativeModule, requireNativeModule } from 'expo';

import { ExpoWidgetsEvents } from './Widgets.types';

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
}

export default requireNativeModule<ExpoWidgetModule>('ExpoWidgets');
