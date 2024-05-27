import type RudderAnalytics from '@expo/rudder-sdk-node';

import { type Actor, getActorDisplayName, getUserAsync } from '../../../api/user/user';
import { RudderClient } from '../RudderClient';
import { getContext } from '../getContext';

jest.mock('@expo/rudder-sdk-node');
jest.mock('../../../api/user/UserSettings', () => ({
  getAnonymousIdentifierAsync: jest.fn().mockResolvedValue('anonymous-id'),
}));
jest.mock('../../../api/user/user', () => ({
  getActorDisplayName: jest.fn(),
  getUserAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockActor = { id: 'fake', __typename: 'User' } as Actor;

it('does not track event when user is not identified', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  await client.record({ event: 'Start Project' });

  expect(sdk.track).not.toHaveBeenCalled();
});

it('tracks event when user is identified', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  jest.mocked(getActorDisplayName).mockReturnValue('expotest');

  await client.identify(mockActor);
  await client.record({ event: 'Start Project' });

  expect(sdk.track).toHaveBeenCalledWith({
    userId: 'fake',
    anonymousId: 'anonymous-id',
    event: 'Start Project',
    context: {
      ...getContext(),
      client: { mode: 'attached' },
    },
  });
});

it('tracks event with correct mode', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk, 'detached');
  const actor = { id: 'fake', __typename: 'User' } as Actor;

  await client.identify(actor);
  await client.record({ event: 'Start Project' });

  expect(sdk.track).toHaveBeenCalledWith({
    userId: 'fake',
    anonymousId: expect.any(String),
    context: {
      ...getContext(),
      client: { mode: 'detached' },
    },
    event: 'Start Project',
  });
});

it('tries to identify when tracking event', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  jest.mocked(getUserAsync).mockImplementationOnce(() =>
    Promise.resolve()
      // Fake the original side-effect of `getUserAsync` to identify the user
      .then(() => client.identify(mockActor))
      .then(() => mockActor)
  );

  expect(client.isIdentified).toBe(false);

  await client.record({ event: 'Start Project' });

  expect(getUserAsync).toHaveBeenCalled();
  expect(client.isIdentified).toBe(true);
});

it('flushes recorded events', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  await client.identify(mockActor);
  await client.record({ event: 'Start Project' });
  await client.flush();

  expect(sdk.flush).toHaveBeenCalled();
});

it('only identifies once when recording events', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  // Create a long running promise, to test if `telemetry.record` awaits `getUserAsync` once
  let getUserAsyncResolve: (actor: Actor) => void;
  const getUserAsyncPromise = new Promise<Actor>((resolve) => {
    getUserAsyncResolve = (actor) => {
      // Fake the original side-effect of `getUserAsync` to identify the user
      client.identify(actor).then(() => resolve(actor));
    };
  });

  jest.mocked(getUserAsync).mockImplementationOnce(() => getUserAsyncPromise);

  // Record events, which should await the _same_ `getUserAsync` promise
  const recordPromise = Promise.all([
    client.record({ event: 'Start Project' }),
    client.record({ event: 'Serve Manifest' }),
    client.record({ event: 'Open Url on Device' }),
  ]);

  expect(getUserAsyncResolve!).not.toBeUndefined();

  // Resolve the `getUserAsync` promise, unblocking the record calls
  getUserAsyncResolve!(mockActor);
  // Wait until the records are complete
  await recordPromise;

  expect(sdk.identify).toHaveBeenCalledTimes(1);
});

it('only identifies once when loading same user', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  await client.identify(mockActor);
  await client.identify(mockActor);

  expect(sdk.identify).toHaveBeenCalledWith(expect.objectContaining({ userId: mockActor.id }));
  expect(sdk.identify).toHaveBeenCalledTimes(1);
});

it('only re-identifies when user has changed', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  await client.identify({ ...mockActor, id: 'old' });
  await client.identify({ ...mockActor, id: 'old' });
  await client.identify({ ...mockActor, id: 'new' });
  await client.identify({ ...mockActor, id: 'new' });

  expect(sdk.identify).toHaveBeenCalledWith(expect.objectContaining({ userId: 'old' }));
  expect(sdk.identify).toHaveBeenCalledWith(expect.objectContaining({ userId: 'new' }));
  expect(sdk.identify).toHaveBeenCalledTimes(2);
});

function mockRudderAnalytics() {
  return {
    track: jest.fn(),
    identify: jest.fn(),
    flush: jest.fn(),
  } as unknown as RudderAnalytics;
}
