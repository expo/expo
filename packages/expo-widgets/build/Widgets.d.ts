import React from 'react';
import ExpoWidgetModule from './ExpoWidgets';
import { LiveActivityComponent, WidgetProps } from './Widgets.types';
export declare const startLiveActivity: (name: string, liveActivity: LiveActivityComponent, url?: string) => string;
export declare const updateLiveActivity: (id: string, name: string, liveActivity: LiveActivityComponent) => void;
export declare const updateWidgetTimeline: <T extends object>(name: string, dates: Date[], widget: (p: WidgetProps<T>) => React.JSX.Element, props?: T, updateFunction?: string) => void;
export declare const updateWidgetSnapshot: <T extends object>(name: string, widget: (p: WidgetProps<T>) => React.JSX.Element, props?: T, updateFunction?: string) => void;
export declare const addEventListener: typeof ExpoWidgetModule.addListener;
//# sourceMappingURL=Widgets.d.ts.map