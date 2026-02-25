import { NativeModule, requireNativeModule } from 'expo';

import type {
  ExpoWidgetsEvents,
  NativeLiveActivity,
  NativeLiveActivityFactory,
  NativeWidgetObject,
} from './Widgets.types';

declare class ExpoWidgetsModule extends NativeModule<ExpoWidgetsEvents> {
  reloadAllWidgets(): void;
  readonly Widget: typeof NativeWidgetObject;
  readonly LiveActivityFactory: typeof NativeLiveActivityFactory;
  readonly LiveActivity: typeof NativeLiveActivity;
}

export default requireNativeModule<ExpoWidgetsModule>('ExpoWidgets');
