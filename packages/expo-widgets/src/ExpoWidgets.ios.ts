import { NativeModule, requireNativeModule } from 'expo';

import type {
  ExpoWidgetsEvents,
  NativeLiveActivity,
  NativeLiveActivityFactory,
  NativeWidgetObject,
  WidgetImageClearOptions,
  WidgetImagePreloadOptions,
  WidgetImagePreloadResult,
} from './Widgets.types';

declare class ExpoWidgetsModule extends NativeModule<ExpoWidgetsEvents> {
  reloadAllWidgets(): void;
  preloadImagesAsync(images: WidgetImagePreloadOptions[]): Promise<WidgetImagePreloadResult>;
  clearPreloadedImagesAsync(options?: WidgetImageClearOptions): Promise<void>;
  readonly Widget: typeof NativeWidgetObject;
  readonly LiveActivityFactory: typeof NativeLiveActivityFactory;
  readonly LiveActivity: typeof NativeLiveActivity;
}

export default requireNativeModule<ExpoWidgetsModule>('ExpoWidgets');
