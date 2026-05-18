import type { EventSubscription } from 'expo-modules-core';

import type {
  ExpoTimelineEntry,
  ExpoWidgetsEvents,
  NativeLiveActivity,
  NativeLiveActivityFactory,
  NativeWidgetObject,
} from './Widgets.types';

const noopSubscription: EventSubscription = { remove() {} };

class WidgetStub {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_name: string, _layout: string) {}
  reload(): void {}
  updateTimeline(_entries: ExpoTimelineEntry[]): void {}
  async getTimeline(): Promise<ExpoTimelineEntry[]> {
    return [];
  }
}

class LiveActivityStub {
  async update(_props: string): Promise<void> {}
  async end(
    _dismissalPolicy?: string,
    _afterDate?: number,
    _state?: string,
    _contentDate?: number
  ): Promise<void> {}
  async getPushToken(): Promise<string | null> {
    return null;
  }
  addListener(_eventName: string, _listener: (...args: unknown[]) => void): EventSubscription {
    return noopSubscription;
  }
}

class LiveActivityFactoryStub {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_name: string, _layout: string) {}
  start(_props: string, _url?: string): NativeLiveActivity {
    return new LiveActivityStub() as NativeLiveActivity;
  }
  getInstances(): NativeLiveActivity[] {
    return [];
  }
}

const ExpoWidgetsModule = {
  reloadAllWidgets(): void {},
  Widget: WidgetStub as typeof NativeWidgetObject,
  LiveActivityFactory: LiveActivityFactoryStub as typeof NativeLiveActivityFactory,
  LiveActivity: LiveActivityStub as typeof NativeLiveActivity,
  addListener<EventName extends keyof ExpoWidgetsEvents>(
    _eventName: EventName,
    _listener: ExpoWidgetsEvents[EventName]
  ): EventSubscription {
    return noopSubscription;
  },
};

export default ExpoWidgetsModule;
