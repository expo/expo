import { NativeModule } from 'expo';
import type { ExpoWidgetsEvents, NativeWidgetObject } from './Widgets.types';
declare class ExpoWidgetsModule extends NativeModule<ExpoWidgetsEvents> {
    reloadAllWidgets(): void;
    readonly Widget: typeof NativeWidgetObject;
}
declare const _default: ExpoWidgetsModule;
export default _default;
//# sourceMappingURL=ExpoWidgets.android.d.ts.map