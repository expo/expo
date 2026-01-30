import { NativeModule } from 'expo';
import { ExpoWidgetsEvents } from './Widgets.types';
declare class ExpoWidgetModule extends NativeModule<ExpoWidgetsEvents> {
    reloadWidget(timeline?: string): void;
    updateWidget(name: string, data: string, props?: Record<string, any>, updateFunction?: string): void;
    startLiveActivity(name: string, nodes: string, url?: string): string;
    updateLiveActivity(id: string, name: string, nodes: string): void;
}
declare const _default: ExpoWidgetModule;
export default _default;
//# sourceMappingURL=ExpoWidgets.d.ts.map