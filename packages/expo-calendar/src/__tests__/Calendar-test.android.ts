import { type Event, updateEventAsync } from '../Calendar';

describe('Calendar', () => {
  describe('updateEventAsync', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    afterAll(() => {
      warnSpy.mockRestore();
    });

    it('calls a warning when details contain the read-only property', async () => {
      const id = 'event-123';
      const details: Partial<Event> = { color: 'red' };

      await updateEventAsync(id, details);

      expect(warnSpy).toHaveBeenCalledWith(
        'updateEventAsync was called with a read-only property, which will not be updated'
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
