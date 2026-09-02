jest.mock('../ExpoCalendar', () => ({
  __esModule: true,
  default: {
    ExpoCalendar: class {},
    ExpoCalendarEvent: class {},
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
