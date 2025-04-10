import { NotificationRequest } from '../Notifications.types';
import { determineNextResponse } from '../useLastNotificationResponse';

describe(determineNextResponse, () => {
  it('returns the new response if it is different from the previous', () => {
    const prevResponse = {
      notification: {
        date: 0,
        request: {
          identifier: '1',
        } as NotificationRequest,
      },
      actionIdentifier: 'actionIdentifier',
    };
    const newResponse = {
      notification: {
        date: 1,
        request: {
          identifier: '2',
        } as NotificationRequest,
      },
      actionIdentifier: 'actionIdentifier',
    };
    expect(determineNextResponse(prevResponse, newResponse)).toBe(newResponse);
    expect(determineNextResponse(undefined, newResponse)).toBe(newResponse);
    expect(determineNextResponse(null, newResponse)).toBe(newResponse);
  });
  it('returns null after a response is available', () => {
    expect(determineNextResponse(undefined, null)).toBeNull();
    expect(determineNextResponse(null, null)).toBeNull();
  });
});
