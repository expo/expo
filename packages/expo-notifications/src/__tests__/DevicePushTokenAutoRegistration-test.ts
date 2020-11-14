import { mocked } from 'ts-jest/utils';

import * as DevicePushTokenAutoRegistration from '../DevicePushTokenAutoRegistration.fx';
import ServerRegistrationModule from '../ServerRegistrationModule';
import generateRetries from '../utils/generateRetries';
import makeInterruptible from '../utils/makeInterruptible';
import { interruptPushTokenUpdates, updatePushTokenAsync } from '../utils/updatePushTokenAsync';

const REGISTRATION_FIXTURE: DevicePushTokenAutoRegistration.DevicePushTokenRegistration = {
  url: 'https://example.com/',
  body: {},
};

jest.mock('../utils/updatePushTokenAsync');
jest.mock('../ServerRegistrationModule');

describe('__handlePersistedRegistrationInfoAsync', () => {
  it(`doesn't fail if persisted value is empty`, async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    await expect(
      DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(null)
    ).resolves.toBeUndefined();
    await expect(
      DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(undefined)
    ).resolves.toBeUndefined();
    await expect(
      DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync('{i-am-invalid-json')
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it(`doesn't try to update registration if no pending token is present`, async () => {
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify(REGISTRATION_FIXTURE)
    );
    expect(updatePushTokenAsync).not.toBeCalled();
  });

  it(`does try to update registration if pending token is present`, async () => {
    const mockPendingDevicePushToken = 'i-want-to-be-sent-to-server';
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify({
        ...REGISTRATION_FIXTURE,
        pendingDevicePushToken: mockPendingDevicePushToken,
      })
    );
    expect(updatePushTokenAsync).toBeCalledWith(mockPendingDevicePushToken);
  });
});

describe('setAutoServerRegistrationAsync', () => {
  it('ensures that the registration will be persisted even if other calls modifying storage are in progress', async () => {
    // An ever-repeating "nasty" meddler which, if aborting wouldn't
    // work properly, would overwrite `registrationInfo` *after*
    // `setAutoServerRegistrationAsync` sets it.
    const [startMeddler, , stopMeddler] = makeInterruptible(async function*() {
      const retriesIterator = generateRetries(
        async retry => {
          // Nasty call - erasing registration information
          await ServerRegistrationModule.setRegistrationInfoAsync?.(null);
          // Always repeat
          retry();
        },
        {
          // By not delaying any duration of time
          // we ensure we try to meddle as much as possible.
          initialDelay: 0,
        }
      );
      // Yield to makeInterruptible on every retry so it can interrupt.
      // This is how generateRetries is supposed to be used.
      let result = (yield retriesIterator.next()) as IteratorResult<void, void>;
      while (!result.done) {
        result = (yield retriesIterator.next()) as IteratorResult<void, void>;
      }
    });
    mocked(interruptPushTokenUpdates).mockImplementation(stopMeddler);

    // Start test scenario
    startMeddler();
    await new Promise(resolve => setTimeout(resolve, 100));

    await DevicePushTokenAutoRegistration.setAutoServerRegistrationAsync(REGISTRATION_FIXTURE);

    // Free the event loop so that if meddler would be able to run
    // it would run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that registration info has been set,
    // as per user's request.
    expect(ServerRegistrationModule.setRegistrationInfoAsync).toHaveBeenLastCalledWith(
      JSON.stringify(REGISTRATION_FIXTURE)
    );
  });
});

describe('removeAutoServerRegistrationAsync', () => {
  it('ensures that the registration will be erased even if other calls modifying storage are in progress', async () => {
    // An ever-repeating "nasty" meddler which, if aborting wouldn't
    // work properly, would overwrite `registrationInfo` *after*
    // `setAutoServerRegistrationAsync` sets it.
    const [startMeddler, , stopMeddler] = makeInterruptible(async function*() {
      const retriesIterator = generateRetries(
        async retry => {
          // Nasty call - erasing registration information
          await ServerRegistrationModule.setRegistrationInfoAsync?.('{}');
          // Always repeat
          retry();
        },
        {
          // By not delaying any duration of time
          // we ensure we try to meddle as much as possible.
          initialDelay: 0,
        }
      );
      // Yield to makeInterruptible on every retry so it can interrupt.
      // This is how generateRetries is supposed to be used.
      let result = (yield retriesIterator.next()) as IteratorResult<void, void>;
      while (!result.done) {
        result = (yield retriesIterator.next()) as IteratorResult<void, void>;
      }
    });
    mocked(interruptPushTokenUpdates).mockImplementation(stopMeddler);

    // Start test scenario
    startMeddler();
    await new Promise(resolve => setTimeout(resolve, 100));

    await DevicePushTokenAutoRegistration.removeAutoServerRegistrationAsync();

    // Free the event loop so that if meddler would be able to run
    // it would run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that registration info has been cleared,
    // as per user's request.
    expect(ServerRegistrationModule.setRegistrationInfoAsync).toHaveBeenLastCalledWith(null);
  });
});
