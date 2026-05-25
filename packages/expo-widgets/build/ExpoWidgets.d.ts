import type { EventSubscription } from 'expo-modules-core';
import type { ExpoWidgetsEvents, NativeLiveActivity, NativeLiveActivityFactory, NativeWidgetObject, WidgetImageClearOptions, WidgetImagePreloadOptions, WidgetImagePreloadResult } from './Widgets.types';
declare const ExpoWidgetsModule: {
    reloadAllWidgets(): void;
    preloadImagesAsync(_images: WidgetImagePreloadOptions[]): Promise<WidgetImagePreloadResult>;
    clearPreloadedImagesAsync(_options?: WidgetImageClearOptions): Promise<void>;
    Widget: typeof NativeWidgetObject;
    LiveActivityFactory: typeof NativeLiveActivityFactory;
    LiveActivity: typeof NativeLiveActivity;
    addListener<EventName extends keyof ExpoWidgetsEvents>(_eventName: EventName, _listener: ExpoWidgetsEvents[EventName]): EventSubscription;
};
export default ExpoWidgetsModule;
//# sourceMappingURL=ExpoWidgets.d.ts.map