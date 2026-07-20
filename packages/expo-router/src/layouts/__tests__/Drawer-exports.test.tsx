import * as VendoredDrawer from '../../react-navigation/drawer';
import * as DrawerEntry from '../Drawer';

// The `expo-router/drawer` entry point re-exports the drawer building blocks (content
// components, items, types, etc.) from the vendored react-navigation so apps can build a
// custom `drawerContent` without depending on `@react-navigation/drawer` directly.
// See https://github.com/expo/expo/issues/46161
describe('expo-router/drawer re-exports', () => {
  // `createDrawerNavigator` (apps use the `Drawer` layout) and the raw contexts
  // (`DrawerStatusContext`/`DrawerActionsContext`/`DrawerProgressContext`, superseded by the
  // `useDrawerStatus`/`useDrawerActions`/`useDrawerProgress` hooks) are intentionally not re-exported.
  const INTENTIONALLY_OMITTED = [
    'createDrawerNavigator',
    'DrawerStatusContext',
    'DrawerActionsContext',
    'DrawerProgressContext',
  ];

  it('re-exports every value from ../react-navigation/drawer except the omitted ones', () => {
    const expected = Object.keys(VendoredDrawer).filter(
      (key) => !INTENTIONALLY_OMITTED.includes(key)
    );
    const missing = expected.filter((key) => !(key in DrawerEntry));
    expect(missing).toEqual([]);
  });

  it('does not export createDrawerNavigator or the raw contexts', () => {
    for (const key of INTENTIONALLY_OMITTED) {
      expect(key in DrawerEntry).toBe(false);
    }
  });

  it('exports the drawer content components requested in #46161', () => {
    expect(DrawerEntry.DrawerContentScrollView).toBeDefined();
    expect(DrawerEntry.DrawerItem).toBeDefined();
    expect(DrawerEntry.DrawerItemList).toBeDefined();
  });

  it('still exports the Drawer navigator as a named and default export', () => {
    expect(DrawerEntry.Drawer).toBeDefined();
    expect(DrawerEntry.default).toBe(DrawerEntry.Drawer);
  });
});
