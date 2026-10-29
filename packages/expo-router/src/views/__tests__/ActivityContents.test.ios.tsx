import { NativeComponentRegistry, View } from 'react-native';

test('keeps Activity content displayed without affecting layout', () => {
  const get = jest
    .spyOn(NativeComponentRegistry, 'get')
    // The test substitutes a regular host view for the registry's host component.
    .mockImplementation(() => View as ReturnType<typeof NativeComponentRegistry.get>);

  require('../ActivityContents');

  expect(get).toHaveBeenCalledTimes(1);
  expect(get.mock.calls[0]![0]).toBe('ExpoRouterActivityContents');

  const config = get.mock.calls[0]![1]();
  expect(config.uiViewClassName).toBe('RCTView');
  const display = config.validAttributes?.style?.display;
  expect(typeof display === 'object' && display?.process?.('none')).toBe('contents');
  expect(typeof display === 'object' && display?.process?.('flex')).toBe('contents');
});
