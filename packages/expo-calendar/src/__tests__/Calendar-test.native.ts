jest.mock('../ExpoCalendar', () => ({
  __esModule: true,
  default: {
    ExpoCalendar: class {},
    ExpoCalendarEvent: class {
      async getExtendedProperties() {
        return [{ name: 'private:x-owner', value: 'mirror-42' }];
      }
      async setExtendedProperty() {}
      async deleteExtendedProperty() {
        return true;
      }
    },
    ExpoCalendarReminder: class {},
    ExpoCalendarAttendee: class {},
    getSourcesSync: jest.fn(),
    requestCalendarPermissions: jest.fn(),
    getCalendarPermissions: jest.fn(),
    requestRemindersPermissions: jest.fn(),
    getRemindersPermissions: jest.fn(),
  },
}));

describe('entrypoints', () => {
  it('root API exports the new calendar classes', () => {
    const root = require('../index');

    expect(root.ExpoCalendar).toBeDefined();
    expect(root.ExpoCalendarEvent).toBeDefined();
    expect(root.ExpoCalendarReminder).toBeDefined();
    expect(root.ExpoCalendarAttendee).toBeDefined();
    expect(root.createCalendar).toBeDefined();
    expect(root.getCalendars).toBeDefined();
    expect(root.listEvents).toBeDefined();
  });

  it('legacy API exports the old methods', () => {
    const legacy = require('../legacy');

    expect(legacy.createCalendarAsync).toBeDefined();
    expect(legacy.getEventsAsync).toBeDefined();
    expect(legacy.createEventAsync).toBeDefined();
    expect(legacy.getSourcesAsync).toBeDefined();
  });

  it('next API remains available as an alias for the new API', () => {
    const next = require('../next');

    expect(next.ExpoCalendar).toBeDefined();
    expect(next.ExpoCalendarEvent).toBeDefined();
    expect(next.createCalendar).toBeDefined();
    expect(next.getCalendars).toBeDefined();
  });

  it('root legacy method stubs warn and throw', async () => {
    const root = require('../index');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(root.createCalendarAsync({ title: 'Calendar' })).rejects.toThrow(
      'expo-calendar/legacy'
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('expo-calendar/legacy'));

    warn.mockRestore();
  });
});

describe('extended properties', () => {
  const properties = [{ name: 'private:x-owner', value: 'mirror-42' }];

  it('are reachable on Android and unavailable everywhere else', async () => {
    const { Platform } = require('react-native');
    const { ExpoCalendarEvent } = require('../index');
    const event = Object.create(ExpoCalendarEvent.prototype);

    if (Platform.OS === 'android') {
      await expect(event.getExtendedProperties()).resolves.toEqual(properties);
      await expect(
        event.setExtendedProperty('private:x-owner', 'mirror-42')
      ).resolves.toBeUndefined();
      await expect(event.deleteExtendedProperty('private:x-owner')).resolves.toBe(true);
    } else {
      // The table backing them exists only in Android's calendar provider.
      await expect(event.getExtendedProperties()).rejects.toThrow(/not available/);
      await expect(event.setExtendedProperty('private:x-owner', 'mirror-42')).rejects.toThrow(
        /not available/
      );
      await expect(event.deleteExtendedProperty('private:x-owner')).rejects.toThrow(
        /not available/
      );
    }
  });
});
