import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Text, View } from 'react-native';

import { create } from '../create-primitive';

test('it renders the given component', async () => {
  const Heading = create(Text, {});
  const Box = create(View, {});

  const { toJSON: textJSON } = render(<Heading>Hi</Heading>);
  let json = textJSON();

  expect(json.type).toEqual('Text');

  let { toJSON: viewJSON } = render(<Box />);
  json = viewJSON();

  expect(json.type).toEqual('View');
});

test('it passes variant style props', async () => {
  const Heading = create(Text, {
    variants: {
      size: {
        large: {
          fontSize: 20,
        },
      },
    },
  });

  const { toJSON } = render(<Heading size="large">Hi</Heading>);

  const json = toJSON();

  expect(json.props.style.fontSize).toEqual(20);
});

test('it passes base style props', async () => {
  const Heading = create(Text, {
    base: {
      fontFamily: 'Helvetica',
    },
  });

  const { toJSON } = render(<Heading>Hi</Heading>);
  const json = toJSON();
  expect(json.props.style).toEqual({ fontFamily: 'Helvetica' });
});

test('it passes non-style props', () => {
  const Heading = create(Text, {
    props: {
      accessibilityRole: 'header',
    },
  });

  const { toJSON } = render(<Heading>Hi</Heading>);
  const json = toJSON();

  expect(json.props.accessibilityRole).toEqual('header');
});

test.todo('selector api');
test.todo('forwarding refs');
