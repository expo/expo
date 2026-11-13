it('throws on import with the migration steps', () => {
  expect(() => jest.requireActual('expo-app-metrics')).toThrow(
    /`expo-observe`.*`expo-observe\/debug`.*remove `expo-app-metrics`/
  );
});
