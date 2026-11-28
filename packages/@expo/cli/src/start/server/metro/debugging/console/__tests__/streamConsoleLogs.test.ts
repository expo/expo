import chalk from 'chalk';

import { createDeviceLabeler } from '../streamConsoleLogs';
import type { ConsoleTarget } from '../types';

function target(logicalDeviceId: string, deviceName: string): ConsoleTarget {
  return {
    id: `${logicalDeviceId}-1`,
    title: 'com.example',
    appId: 'com.example',
    deviceName,
    logicalDeviceId,
    webSocketDebuggerUrl: 'ws://127.0.0.1/inspector/debug',
  };
}

const originalLevel = chalk.level;

beforeAll(() => {
  chalk.level = 1;
});

afterAll(() => {
  chalk.level = originalLevel;
});

test('labels the first device plainly and each later device in the next color', () => {
  const labelDevice = createDeviceLabeler();

  expect(labelDevice(target('a', 'iPhone 18 Pro'))).toBe('iPhone 18 Pro');
  expect(labelDevice(target('b', 'iPhone 17 Pro'))).toBe(chalk.cyan('iPhone 17 Pro'));
  expect(labelDevice(target('c', 'Pixel 10a'))).toBe(chalk.magenta('Pixel 10a'));
  expect(labelDevice(target('a', 'iPhone 18 Pro'))).toBe('iPhone 18 Pro');
});

test('gives two devices with the same name different colors', () => {
  const labelDevice = createDeviceLabeler();

  labelDevice(target('a', 'iPhone 18 Pro'));

  expect(labelDevice(target('b', 'iPhone 18 Pro'))).toBe(chalk.cyan('iPhone 18 Pro'));
});

test('repeats the colors after the last one', () => {
  const labelDevice = createDeviceLabeler();

  const labels = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => labelDevice(target(id, id)));

  expect(labels[5]).toBe(chalk.cyan('f'));
});
