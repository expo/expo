import { NativeModule, requireNativeModule } from 'expo';

import type {
  NativeCustomNotification,
  NativeCustomNotificationFactory,
} from './CustomNotifications.types';
import type {
  ExpoWidgetsEvents,
  NativeLiveActivity,
  NativeLiveActivityFactory,
  NativeWidgetObject,
} from './Widgets.types';

declare class ExpoWidgetsModule extends NativeModule<ExpoWidgetsEvents> {
  widgetsDirectory: string;
  reloadAllWidgets(): void;
  readonly Widget: typeof NativeWidgetObject;
  /** iOS only. */
  readonly LiveActivityFactory: typeof NativeLiveActivityFactory;
  readonly LiveActivity: typeof NativeLiveActivity;
  /** Android only. */
  readonly CustomNotificationFactory: typeof NativeCustomNotificationFactory;
  readonly CustomNotification: typeof NativeCustomNotification;
}

export default requireNativeModule<ExpoWidgetsModule>('ExpoWidgets');
