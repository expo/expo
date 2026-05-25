import { NativeModule } from 'expo';
import type { ExpoWidgetsEvents, NativeLiveActivity, NativeLiveActivityFactory, NativeWidgetObject, WidgetImageClearOptions, WidgetImagePreloadOptions, WidgetImagePreloadResult } from './Widgets.types';
declare class ExpoWidgetsModule extends NativeModule<ExpoWidgetsEvents> {
    reloadAllWidgets(): void;
    preloadImagesAsync(images: WidgetImagePreloadOptions[]): Promise<WidgetImagePreloadResult>;
    clearPreloadedImagesAsync(options?: WidgetImageClearOptions): Promise<void>;
    readonly Widget: typeof NativeWidgetObject;
    readonly LiveActivityFactory: typeof NativeLiveActivityFactory;
    readonly LiveActivity: typeof NativeLiveActivity;
}
declare const _default: ExpoWidgetsModule;
export default _default;
//# sourceMappingURL=ExpoWidgets.ios.d.ts.map