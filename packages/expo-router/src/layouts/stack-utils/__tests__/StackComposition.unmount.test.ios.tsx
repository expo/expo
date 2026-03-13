import { act, fireEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Button, Text } from 'react-native';
import {
  ScreenStackHeaderSearchBarView as _ScreenStackHeaderSearchBarView,
  ScreenStackItem as _ScreenStackItem,
} from 'react-native-screens';

import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
    ScreenStackHeaderSearchBarView: jest.fn((props) => (
      <actualScreens.ScreenStackHeaderSearchBarView {...props} />
    )),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;
const ScreenStackHeaderSearchBarView = _ScreenStackHeaderSearchBarView as jest.MockedFunction<
  typeof _ScreenStackHeaderSearchBarView
>;

describe('Stack composition component unmount resets options', () => {
  it('unmounting Stack.Screen.Title resets title to route name', () => {
    function Index() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && <Stack.Screen.Title>Custom</Stack.Screen.Title>}
          <Text testID="content">Content</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    renderRouter({ _layout: () => <Stack />, index: Index });

    // [0] is initial layout render, [1] is composition registration
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.title).toBe('Custom');

    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const finalProps = ScreenStackItem.mock.calls[0][0];
    expect(finalProps.headerConfig?.title).toBe('index');
  });

  it('unmounting Stack.Screen.BackButton resets back button options', () => {
    function Index() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && <Stack.Screen.BackButton>Go Back</Stack.Screen.BackButton>}
          <Text testID="content">Content</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    renderRouter({ _layout: () => <Stack />, index: Index });

    // [0] is initial layout render, [1] is composition registration
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.backTitle).toBe('Go Back');

    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const finalProps = ScreenStackItem.mock.calls[0][0];
    expect(finalProps.headerConfig?.backTitle).toBeUndefined();
  });

  it('unmounting Stack.Header resets header styling options', () => {
    function Index() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && <Stack.Header blurEffect="regular" />}
          <Text testID="content">Content</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    // Setting headerShown to false to also test that unmounting composition components can reset options that hide the header
    renderRouter({ _layout: () => <Stack screenOptions={{ headerShown: false }} />, index: Index });

    // [0] is initial layout render, [1] is composition registration
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.blurEffect).toBe('regular');
    expect(initialProps.headerConfig?.hidden).toBe(false);

    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const finalProps = ScreenStackItem.mock.calls[0][0];
    expect(finalProps.headerConfig?.blurEffect).toBeUndefined();
    expect(finalProps.headerConfig?.hidden).toBe(true);
  });

  it('unmounting Stack.SearchBar resets search bar options', () => {
    function Index() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && <Stack.SearchBar placeholder="Search..." />}
          <Text testID="content">Content</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    // Setting headerShown to false to also test that unmounting composition components can reset options that hide the header
    renderRouter({ _layout: () => <Stack screenOptions={{ headerShown: false }} />, index: Index });

    // headerSearchBarOptions is rendered as a SearchBar child inside ScreenStackHeaderSearchBarView
    expect(ScreenStackHeaderSearchBarView).toHaveBeenCalled();
    // [0] is initial layout render, [1] is composition registration
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.hidden).toBe(false);

    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    // SearchBar view is no longer rendered after composition option is cleared
    expect(ScreenStackHeaderSearchBarView).not.toHaveBeenCalled();
    const finalProps = ScreenStackItem.mock.calls[0][0];
    expect(finalProps.headerConfig?.hidden).toBe(true);
  });

  it('unmounting Stack.Toolbar placement="left" resets left bar button items', () => {
    function Index() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && (
            <Stack.Toolbar placement="left">
              <Stack.Toolbar.Button icon="sidebar.left" onPress={() => {}} />
            </Stack.Toolbar>
          )}
          <Text testID="content">Content</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    renderRouter({ _layout: () => <Stack />, index: Index });

    // [0] is initial layout render, [1] is composition registration
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.headerLeftBarButtonItems).toBeDefined();

    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const finalProps = ScreenStackItem.mock.calls[0][0];
    expect(finalProps.headerConfig?.headerLeftBarButtonItems).toBeUndefined();
  });

  it('unmounting Stack.Toolbar placement="right" resets right bar button items', () => {
    function Index() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && (
            <Stack.Toolbar placement="right">
              <Stack.Toolbar.Button icon="star" onPress={() => {}} />
            </Stack.Toolbar>
          )}
          <Text testID="content">Content</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    renderRouter({ _layout: () => <Stack />, index: Index });

    // [0] is initial layout render, [1] is composition registration
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.headerRightBarButtonItems).toBeDefined();

    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const finalProps = ScreenStackItem.mock.calls[0][0];
    expect(finalProps.headerConfig?.headerRightBarButtonItems).toBeUndefined();
  });
});
