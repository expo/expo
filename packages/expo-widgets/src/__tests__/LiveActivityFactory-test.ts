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

it('starts with a relevance score without requiring a URL or stale date', () => {
  factory.start(props, { relevanceScore: 5 });
  expect(mockStart.mock.calls).toEqual([[JSON.stringify(props), { relevanceScore: 5 }]]);
});

it('passes the scheduled start, alert, and initial relevance score to the native factory', () => {
  const startDate = new Date('2027-01-01T12:00:00Z');
  const alertConfiguration = {
    title: 'Delivery',
    body: 'Your driver is nearby',
    sound: 'delivery.caf',
  };

  factory.start(props, {
    url,
    staleDate,
    relevanceScore: 0,
    schedule: { startDate, alertConfiguration },
  });

  expect(mockStart.mock.calls).toEqual([
    [
      JSON.stringify(props),
      {
        url,
        staleDate: staleDate.getTime(),
        relevanceScore: 0,
        schedule: { startDate: startDate.getTime(), alertConfiguration },
      },
    ],
  ]);
});

it.each([
  [undefined, {}],
  [{ relevanceScore: 0 }, { relevanceScore: 0 }],
  [
    { relevanceScore: 5, staleDate },
    { relevanceScore: 5, staleDate: staleDate.getTime() },
  ],
] as const)('updates with the native options record for %j', (options, nativeOptions) => {
  const activity = factory.start(props);
  const updatedProps = { status: 'Arriving' };

  activity.update(updatedProps, options);
  expect(mockUpdate.mock.calls).toEqual([[JSON.stringify(updatedProps), nativeOptions]]);
});

it('preserves the positional stale date when updating without a relevance score', () => {
  const activity = factory.start(props);

  activity.update(props, { staleDate });
  activity.update(props, staleDate);
  const args = [JSON.stringify(props), { staleDate: staleDate.getTime() }];
  expect(mockUpdate.mock.calls).toEqual([args, args]);
});

it('passes the content date when updating', () => {
  const activity = factory.start(props);
  const contentDate = new Date(1000);

  activity.update(props, { staleDate, contentDate });
  expect(mockUpdate.mock.calls).toEqual([
    [JSON.stringify(props), { staleDate: staleDate.getTime(), contentDate: contentDate.getTime() }],
  ]);
});
