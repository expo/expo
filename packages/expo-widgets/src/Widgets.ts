import React from 'react';

import ExpoWidgetModule from './ExpoWidgets';
import {
  ExpoTimelineEntry,
  LiveActivityComponent,
  WidgetFamily,
  WidgetProps,
} from './Widgets.types';
import { supportedFamilies } from './constants';
import { serialize } from './serializer';

export const startLiveActivity = (
  name: string,
  liveActivity: LiveActivityComponent,
  url?: string
) => {
  const text = serialize(liveActivity());
  return ExpoWidgetModule.startLiveActivity(name, text, url);
};

export const updateLiveActivity = (
  id: string,
  name: string,
  liveActivity: LiveActivityComponent
) => {
  const text = serialize(liveActivity());
  ExpoWidgetModule.updateLiveActivity(id, name, text);
};

export const updateWidgetTimeline = <T extends object>(
  name: string,
  dates: Date[],
  widget: (p: WidgetProps<T>) => React.JSX.Element,
  props?: T,
  updateFunction?: string
) => {
  const fakeProps = Object.keys(props || {}).reduce(
    (acc, key) => {
      acc[key] = `{{${key}}}`;
      return acc;
    },
    {} as Record<string, string>
  );

  const data: Record<WidgetFamily, ExpoTimelineEntry[]> = supportedFamilies
    .map((family) => ({
      family,
      entries: dates.map((date) => ({
        timestamp: date.getTime(),
        content: widget({ date, family, ...(fakeProps as T) }),
      })),
    }))
    .reduce(
      (acc, { family, entries }) => {
        acc[family] = entries;
        return acc;
      },
      {} as Record<WidgetFamily, ExpoTimelineEntry[]>
    );

  ExpoWidgetModule.updateWidget(name, serialize(data), props, updateFunction);

  ExpoWidgetModule.reloadWidget();
};

export const updateWidgetSnapshot = <T extends object>(
  name: string,
  widget: (p: WidgetProps<T>) => React.JSX.Element,
  props?: T,
  updateFunction?: string // (target: string, props: T) => T
) => {
  updateWidgetTimeline(name, [new Date()], widget, props || ({} as T), updateFunction);
};

export const addEventListener: typeof ExpoWidgetModule.addListener = ExpoWidgetModule.addListener;
