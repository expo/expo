import { type Event, updateEventAsync } from '../Calendar';

describe('Calendar', () => {
  describe('updateEventAsync', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    afterAll(() => {
      warnSpy.mockRestore();
    });

    it('calls a warning when details contain read-only properties', async () => {
      const id = 'event-123';
      const details: Partial<Event> = {
        creationDate: '2024-01-01',
        lastModifiedDate: '2024-01-02',
        originalStartDate: '2024-01-03',
        isDetached: true,
        organizer: 'test@example.com',
      };

      await updateEventAsync(id, details);

      expect(warnSpy).toHaveBeenCalledWith(
        'updateEventAsync was called with one or more read-only properties, which will not be updated'
      );
    });

    it('does not call a warning when details do not contain any read-only properties', async () => {
      const id = 'event-123';
      const details: Partial<Event> = { title: 'Meeting' };

      await updateEventAsync(id, details);

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
