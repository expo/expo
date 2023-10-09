import { render } from '@testing-library/react';
import React from 'react';

import { Pressable, LogBox, Platform, Text, View } from 'react-native';
import { Link } from '../Link';

// LogBox.ignoreLogs([/"transform" style array value is deprecated\./]);

// Render and observe the props of the Link component.

it('renders a Link', () => {
  const { asFragment, getByTestId } = render(
    <Link testID="link" href="/foo">
      Foo
    </Link>
  );
  const node = getByTestId('link');
  expect(node).toMatchInlineSnapshot();
  expect(node.attributes).toBe();
  expect(node.props.href).toBe('/foo');
  expect(node.props).toEqual({
    children: 'Foo',
    href: '/foo',
    onPress: expect.any(Function),
    role: 'link',
  });
});

xit('renders a Link with a slot', () => {
  const { getByText, getByTestId } = render(
    <Link asChild href="/foo">
      <View testID="pressable">
        <Text testID="inner-text">Button</Text>
      </View>
    </Link>
  );
  const node = getByText('Button');
  expect(node.props).toEqual({
    children: 'Button',
    testID: 'inner-text',
  });

  const pressable = getByTestId('pressable');
  if (Platform.OS === 'web') {
    expect(pressable.props).toEqual(
      expect.objectContaining({
        children: expect.anything(),
        href: '/foo',
        role: 'link',
        testID: 'pressable',
        onClick: expect.any(Function),
      })
    );
  } else {
    expect(pressable.props).toEqual(
      expect.objectContaining({
        children: expect.anything(),
        href: '/foo',
        role: 'link',
        testID: 'pressable',
        onPress: expect.any(Function),
      })
    );
  }
});

xit('mixes styles with className', () => {
  const { getByText, getByTestId } = render(
    <Link href="/foo" testID="link" style={{ color: 'red' }} className="xxx">
      Hello
    </Link>
  );
  const node = getByTestId('link');
  if (Platform.OS === 'web') {
    expect(node.props)
      .toEqual
      // expect.objectContaining({
      //   children: expect.anything(),
      //   href: '/foo',
      //   role: 'link',
      //   testID: 'pressable',
      //   onClick: expect.any(Function),
      // })
      ();
  } else {
    // expect(node.props).toEqual(
    //   expect.objectContaining({
    //     children: expect.anything(),
    //     href: '/foo',
    //     role: 'link',
    //     testID: 'pressable',
    //     onPress: expect.any(Function),
    //   })
    // );
  }
});
