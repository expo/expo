import { UnavailabilityError } from 'expo';

import { createLiveActivity, createWidget, LiveActivityFactory, Widget } from '../Widgets';

// The Android module has no LiveActivityFactory, and its Widget class only has reload and updateSnapshot.
jest.mock('../ExpoWidgets', () => ({
  __esModule: true,
  default: {
    widgetsDirectory: '',
    reloadAllWidgets() {},
    Widget: class {
      reload() {}
      updateSnapshot() {}
    },
    CustomNotificationFactory: class {},
    CustomNotification: class {},
    addListener() {
      return { remove() {} };
    },
  },
}));

describe(LiveActivityFactory, () => {
  const DeliveryActivity = () => ({ banner: null });

  it('is created without a native LiveActivityFactory', () => {
    expect(() => createLiveActivity('DeliveryActivity', DeliveryActivity)).not.toThrow();
  });

  it('throws UnavailabilityError when it starts or lists activities', () => {
    const factory = createLiveActivity('DeliveryActivity', DeliveryActivity);
    expect(() => factory.start({})).toThrow(UnavailabilityError);
    expect(() => factory.getInstances()).toThrow(UnavailabilityError);
  });
});

describe(Widget, () => {
  const widget = createWidget<object, { category: string }>('MyWidget', () => <></>);

  it('resolves getTimeline with no entries', async () => {
    await expect(widget.getTimeline()).resolves.toEqual([]);
  });

  it('ignores setConfigurationParameterEnum', () => {
    expect(() =>
      widget.setConfigurationParameterEnum('category', [{ name: 'Work', value: 'work' }])
    ).not.toThrow();
  });
});
