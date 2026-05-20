import React from 'react';
import { Text } from 'react-native';

import { isChildOfType } from '../../../utils/children';
import { Protected, type ProtectedProps } from '../../../views/Protected';
import { Screen } from '../../../views/Screen';
import { StackHeaderComponent } from '../StackHeaderComponent';
import { StackScreen } from '../StackScreen';
import { mapProtectedScreen } from '../mapProtectedScreen';

describe(mapProtectedScreen, () => {
  it('converts StackScreen with static options to Screen', () => {
    const result = mapProtectedScreen({
      guard: true,
      children: <StackScreen name="home" options={{ title: 'Home' }} />,
    });

    const children = React.Children.toArray(result.children);
    expect(children).toHaveLength(1);

    const child = children[0] as React.ReactElement<any>;
    expect(isChildOfType(child, Screen)).toBe(true);
    expect(child.props.name).toBe('home');

    // Options should be processed through appendScreenStackPropsToOptions
    expect(child.props.options).toMatchObject({ title: 'Home' });
  });

  it('converts StackScreen with function-form options', () => {
    const optionsFn = jest.fn(({ route }) => ({ title: route.params?.name }));

    const result = mapProtectedScreen({
      guard: true,
      children: <StackScreen name="profile" options={optionsFn} />,
    });

    const children = React.Children.toArray(result.children);
    expect(children).toHaveLength(1);

    const child = children[0] as React.ReactElement<any>;
    expect(isChildOfType(child, Screen)).toBe(true);
    expect(child.props.name).toBe('profile');

    // Options should be a function wrapping appendScreenStackPropsToOptions
    expect(typeof child.props.options).toBe('function');
  });

  it('recursively processes nested Protected wrappers', () => {
    const result = mapProtectedScreen({
      guard: true,
      children: (
        <Protected guard={false}>
          <StackScreen name="secret" options={{ title: 'Secret' }} />
        </Protected>
      ),
    });

    const children = React.Children.toArray(result.children);
    expect(children).toHaveLength(1);

    const protectedChild = children[0] as React.ReactElement<ProtectedProps>;
    expect(isChildOfType(protectedChild, Protected)).toBe(true);

    // The nested children should also be converted
    const nestedChildren = React.Children.toArray(protectedChild.props.children);
    expect(nestedChildren).toHaveLength(1);

    const screenChild = nestedChildren[0] as React.ReactElement<any>;
    expect(isChildOfType(screenChild, Screen)).toBe(true);
    expect(screenChild.props.name).toBe('secret');
  });

  it('filters out StackHeader children (returns null)', () => {
    const result = mapProtectedScreen({
      guard: true,
      children: [
        <StackHeaderComponent key="header" transparent />,
        <StackScreen key="home" name="home" options={{ title: 'Home' }} />,
      ],
    });

    const children = React.Children.toArray(result.children);
    // Only StackScreen should remain, StackHeader should be filtered
    expect(children).toHaveLength(1);

    const child = children[0] as React.ReactElement<any>;
    expect(isChildOfType(child, Screen)).toBe(true);
    expect(child.props.name).toBe('home');
  });

  it('warns on unknown children', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mapProtectedScreen({
      guard: true,
      children: <Text>Unknown</Text>,
    });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown child element passed to Stack')
    );
    spy.mockRestore();
  });

  it('preserves guard property', () => {
    const result = mapProtectedScreen({
      guard: false,
      children: <StackScreen name="home" options={{ title: 'Home' }} />,
    });

    expect(result.guard).toBe(false);
  });

  it('handles multiple children', () => {
    const result = mapProtectedScreen({
      guard: true,
      children: [
        <StackScreen key="home" name="home" options={{ title: 'Home' }} />,
        <StackScreen key="settings" name="settings" options={{ title: 'Settings' }} />,
      ],
    });

    const children = React.Children.toArray(result.children);
    expect(children).toHaveLength(2);

    expect((children[0] as React.ReactElement<any>).props.name).toBe('home');
    expect((children[1] as React.ReactElement<any>).props.name).toBe('settings');
  });

  it('converts StackScreen children (sub-components) into options', () => {
    const result = mapProtectedScreen({
      guard: true,
      children: (
        <StackScreen name="home" options={{ headerShown: true }}>
          <StackHeaderComponent transparent />
        </StackScreen>
      ),
    });

    const children = React.Children.toArray(result.children);
    expect(children).toHaveLength(1);

    const child = children[0] as React.ReactElement<any>;
    expect(isChildOfType(child, Screen)).toBe(true);

    // The StackHeaderComponent child should have been processed into options
    expect(child.props.options).toMatchObject({
      headerShown: true,
      headerTransparent: true,
    });
  });
});
