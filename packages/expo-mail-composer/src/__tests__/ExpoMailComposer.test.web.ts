import ExpoMailComposer from '../ExpoMailComposer';

if (typeof window !== 'undefined') {
  const originalWindowOpen = window.open;

  beforeAll(() => {
    window.open = jest.fn();
  });

  afterAll(() => {
    window.open = originalWindowOpen;
  });
  it(`launches mail with nullish params removed`, () => {
    ExpoMailComposer.composeAsync({
      recipients: ['evan'],
      bccRecipients: null,
    });
    expect(window.open).toHaveBeenLastCalledWith('mailto:evan');
  });
  it(`launches mail`, () => {
    ExpoMailComposer.composeAsync({
      recipients: ['evan', 'bacon'],
      body: 'Hello world!',
    });
    expect(window.open).toHaveBeenLastCalledWith('mailto:evan,bacon?body=Hello+world%21');
    ExpoMailComposer.composeAsync({
      recipients: 'bacon@expo.io',
    });
    expect(window.open).toHaveBeenLastCalledWith('mailto:bacon@expo.io');
  });

  it(`launches mail with no settings`, () => {
    ExpoMailComposer.composeAsync({});
    expect(window.open).toHaveBeenLastCalledWith('mailto:');
  });
} else {
  it(`does nothing in server environments`, async () => {
    expect(
      await ExpoMailComposer.composeAsync({
        recipients: ['evan', 'bacon'],
        body: 'Hello world!',
      })
    ).toEqual({ status: 'cancelled' });
  });
}
