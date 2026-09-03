import type { render as renderComponent } from '@testing-library/react-native/pure';

import type ExpoNavigationBar from '../ExpoNavigationBar';
import type { NavigationBar as NavigationBarComponent } from '../NavigationBar';

jest.mock('../ExpoNavigationBar', () => ({
  __esModule: true,
  default: {
    setStyle: jest.fn(() => Promise.resolve()),
    setHidden: jest.fn(() => Promise.resolve()),
  },
}));

// The entries stack, the defaults and the last values sent to the native module are module-level
// state, so every case loads its own copy of the module registry to stay independent from the
// others. `render` is loaded from that same copy because the component and the renderer have to
// share one instance of React; it comes from the `pure` entry point because the default one
// registers an `afterEach` cleanup hook, which Jest does not allow from inside a test.
function loadNavigationBar() {
  let modules!: {
    render: typeof renderComponent;
    NavigationBar: typeof NavigationBarComponent;
    native: jest.Mocked<typeof ExpoNavigationBar>;
  };

  jest.isolateModules(() => {
    modules = {
      render: require('@testing-library/react-native/pure').render,
      NavigationBar: require('../NavigationBar').NavigationBar,
      native: require('../ExpoNavigationBar').default,
    };
  });

  return modules;
}

describe('NavigationBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('restores the navigation bar when a component with `hidden` unmounts', () => {
    const { render, NavigationBar, native } = loadNavigationBar();

    const { unmount } = render(<NavigationBar hidden />);
    jest.runAllTimers();
    expect(native.setHidden).toHaveBeenLastCalledWith(true);

    unmount();
    jest.runAllTimers();
    expect(native.setHidden).toHaveBeenLastCalledWith(false);
  });

  it('restores the default style when a component with `style` unmounts', () => {
    const { render, NavigationBar, native } = loadNavigationBar();

    const { unmount } = render(<NavigationBar style="dark" />);
    jest.runAllTimers();
    expect(native.setStyle).toHaveBeenLastCalledWith('dark');

    unmount();
    jest.runAllTimers();
    expect(native.setStyle).toHaveBeenLastCalledWith('light');
  });

  it('restores the navigation bar when a component with `hidden` unmounts and another stays mounted', () => {
    const { render, NavigationBar, native } = loadNavigationBar();

    // The documented multi-screen pattern: a long-lived bar at the app root and a screen that
    // hides the bar while it is on screen.
    render(<NavigationBar style="dark" />);
    const screen = render(<NavigationBar hidden />);
    jest.runAllTimers();
    expect(native.setStyle).toHaveBeenLastCalledWith('dark');
    expect(native.setHidden).toHaveBeenLastCalledWith(true);

    screen.unmount();
    jest.runAllTimers();
    // The remaining entry does not specify `hidden`, so the default has to be restored, while
    // the style it does specify stays applied.
    expect(native.setHidden).toHaveBeenLastCalledWith(false);
    expect(native.setStyle).toHaveBeenLastCalledWith('dark');
  });

  it('restores the value set with `NavigationBar.setHidden` when a component unmounts', () => {
    const { render, NavigationBar, native } = loadNavigationBar();

    NavigationBar.setHidden(true);
    expect(native.setHidden).toHaveBeenLastCalledWith(true);

    const { unmount } = render(<NavigationBar hidden={false} />);
    jest.runAllTimers();
    expect(native.setHidden).toHaveBeenLastCalledWith(false);

    unmount();
    jest.runAllTimers();
    expect(native.setHidden).toHaveBeenLastCalledWith(true);
  });
});
