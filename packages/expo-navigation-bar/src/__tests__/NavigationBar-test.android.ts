import ExpoNavigationBar from '../ExpoNavigationBar';
import * as NavigationBar from '../NavigationBar';

it(`resolves the visibility from the native module`, async () => {
  await expect(NavigationBar.getVisibilityAsync()).resolves.toBe('visible');
  expect(ExpoNavigationBar.getVisibilityAsync).toHaveBeenCalled();
});

it(`calls setHidden from setVisibilityAsync`, async () => {
  await NavigationBar.setVisibilityAsync('hidden');
  expect(ExpoNavigationBar.setHidden).toHaveBeenLastCalledWith(true);
});

it(`adds and removes a visibility listener`, () => {
  const subscription = NavigationBar.addVisibilityListener(() => {});
  expect(() => subscription.remove()).not.toThrow();
});
