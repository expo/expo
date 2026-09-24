import { DeviceEventEmitter, Platform } from 'react-native';

import { registerDevMenuItems } from '../DevMenu';
import ExpoDevMenu from '../ExpoDevMenu';

jest.mock('../ExpoDevMenu', () => ({
  addDevMenuCallbacks: jest.fn(),
}));

it('keeps legacy registrations and callbacks working', async () => {
  const callback = jest.fn();
  await registerDevMenuItems([{ name: 'Legacy action', callback, shouldCollapse: false }]);

  expect(ExpoDevMenu.addDevMenuCallbacks).toHaveBeenCalledWith([
    {
      name: 'Legacy action',
      shouldCollapse: false,
      icon: undefined,
      group: undefined,
    },
  ]);
  DeviceEventEmitter.emit('registeredCallbackFired', 'Legacy action');
  expect(callback).toHaveBeenCalledTimes(1);
});

it('sends the icon for the current platform and a normalized group', async () => {
  const icon = { ios: 'person.crop.circle', android: 'account' } as const;
  await registerDevMenuItems([
    {
      name: 'Account',
      icon,
      group: '  Account tools  ',
      callback: jest.fn(),
      shouldCollapse: true,
    },
  ]);

  expect(ExpoDevMenu.addDevMenuCallbacks).toHaveBeenCalledWith([
    {
      name: 'Account',
      icon: icon[Platform.OS as 'ios' | 'android'],
      group: 'Account tools',
      shouldCollapse: true,
    },
  ]);
});

it('does not use the other platform icon as a fallback', async () => {
  const icon =
    Platform.OS === 'ios' ? { android: 'account' } : { ios: 'person.crop.circle' as const };
  await registerDevMenuItems([{ name: 'Account', icon, callback: jest.fn() }]);

  expect(ExpoDevMenu.addDevMenuCallbacks.mock.calls[0][0][0].icon).toBeUndefined();
});

it('treats blank groups and icons as absent', async () => {
  await registerDevMenuItems([
    // JavaScript callers can still pass whitespace despite the SF Symbol type.
    {
      name: 'Action',
      group: ' \n ',
      icon: { ios: ' ' as never, android: ' ' },
      callback: jest.fn(),
    },
  ]);

  expect(ExpoDevMenu.addDevMenuCallbacks.mock.calls[0][0][0]).toEqual({
    name: 'Action',
    shouldCollapse: undefined,
    group: undefined,
    icon: undefined,
  });
});

it('preserves registration order when groups are interleaved', async () => {
  const items = [
    { name: 'Preview intro', group: 'Previews', callback: jest.fn() },
    { name: 'Switch account', group: 'Account', callback: jest.fn() },
    { name: 'Preview card', group: 'Previews', callback: jest.fn() },
    { name: 'Legacy action', callback: jest.fn() },
  ];
  await registerDevMenuItems(items);

  expect(
    ExpoDevMenu.addDevMenuCallbacks.mock.calls[0][0].map((item: { name: string }) => item.name)
  ).toEqual(items.map((item) => item.name));
  for (const item of items) {
    DeviceEventEmitter.emit('registeredCallbackFired', item.name);
    expect(item.callback).toHaveBeenCalledTimes(1);
  }
});

it('replaces previous registrations instead of retaining their handlers', async () => {
  const previous = jest.fn();
  const current = jest.fn();
  await registerDevMenuItems([{ name: 'Previous', group: 'Old', callback: previous }]);
  await registerDevMenuItems([{ name: 'Current', group: 'New', callback: current }]);

  DeviceEventEmitter.emit('registeredCallbackFired', 'Previous');
  DeviceEventEmitter.emit('registeredCallbackFired', 'Current');
  expect(previous).not.toHaveBeenCalled();
  expect(current).toHaveBeenCalledTimes(1);
  expect(ExpoDevMenu.addDevMenuCallbacks).toHaveBeenLastCalledWith([
    expect.objectContaining({ name: 'Current', group: 'New' }),
  ]);
});

it('sends an empty registration and stops dispatching previous callbacks', async () => {
  const callback = jest.fn();
  await registerDevMenuItems([{ name: 'Action', group: 'Tools', callback }]);
  await registerDevMenuItems([]);

  DeviceEventEmitter.emit('registeredCallbackFired', 'Action');
  expect(callback).not.toHaveBeenCalled();
  expect(ExpoDevMenu.addDevMenuCallbacks).toHaveBeenLastCalledWith([]);
});
