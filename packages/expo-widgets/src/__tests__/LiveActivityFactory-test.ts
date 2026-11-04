import { createLiveActivity } from '../Widgets';

const mockUpdate = jest.fn();
const mockStart = jest.fn(() => ({ update: mockUpdate }));

jest.mock('../ExpoWidgets', () => ({
  LiveActivityFactory: class {
    start = mockStart;
  },
}));

const factory = createLiveActivity('DeliveryActivity', () => ({ banner: null }));
const props = { status: 'On the way' };
const url = 'myapp://deliveries/123';
const staleDate = new Date(0);

it.each([{ url, staleDate }, { staleDate }, { url }, {}])(
  'passes the same native arguments for %j and its positional equivalent',
  (options) => {
    factory.start(props, options);
    factory.start(props, options.url, options.staleDate);

    const args = [
      JSON.stringify(props),
      { url: options.url, staleDate: options.staleDate?.getTime() },
    ];
    expect(mockStart.mock.calls).toEqual([args, args]);
  }
);

it('passes an empty native options record for a props-only update', () => {
  const activity = factory.start(props);
  const updatedProps = { status: 'Arriving' };

  activity.update(updatedProps);
  expect(mockUpdate.mock.calls).toEqual([[JSON.stringify(updatedProps), {}]]);
});

it('preserves the positional stale date when updating', () => {
  const activity = factory.start(props);

  activity.update(props, { staleDate });
  activity.update(props, staleDate);
  const args = [JSON.stringify(props), { staleDate: staleDate.getTime() }];
  expect(mockUpdate.mock.calls).toEqual([args, args]);
});
