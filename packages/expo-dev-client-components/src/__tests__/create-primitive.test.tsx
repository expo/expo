import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Text, View } from 'react-native';

import { create } from '../create-primitive';
import { ThemeProvider } from '../useExpoTheme';

test('it renders the given component', async () => {
  const Heading = create(Text, {});
  const Box = create(View, {});

  const { toJSON: textJSON } = render(<Heading>Hi</Heading>);
  let json: any = textJSON();

  expect(json.type).toEqual('Text');

  const { toJSON: viewJSON } = render(<Box />);
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

  const json: any = toJSON();

  expect(json.props.style.fontSize).toEqual(20);
});

test('it passes base style props', async () => {
  const Heading = create(Text, {
    base: {
      fontFamily: 'Helvetica',
    },
  });

  const { toJSON } = render(<Heading>Hi</Heading>);
  const json: any = toJSON();
  expect(json.props.style).toEqual({ fontFamily: 'Helvetica' });
});

test('it passes non-style props', () => {
  const Heading = create(Text, {
    props: {
      accessibilityRole: 'header',
    },
  });

  const { toJSON } = render(<Heading>Hi</Heading>);
  const json: any = toJSON();

  expect(json.props.accessibilityRole).toEqual('header');
});

test('initial render with the correct style for dark mode', () => {
  const selectors = {
    light: {
      bg: {
        test: {
          backgroundColor: 'red',
        },
      },
    },
    dark: {
      bg: {
        test: {
          backgroundColor: 'blue',
        },
      },
    },
  };

  const Heading = create(Text, {
    selectors: {
      light: {
        bg: {
          test: {
            backgroundColor: 'red',
          },
        },
      },
      dark: {
        bg: {
          test: {
            backgroundColor: 'blue',
          },
        },
      },
    },
  });

  const { toJSON, rerender } = render(
    <ThemeProvider themePreference="dark">
      <Heading bg="test">Hi</Heading>
    </ThemeProvider>
  );

  const darkThemeRender: any = toJSON();

  expect(darkThemeRender.props.style.backgroundColor).toEqual(
    selectors.dark.bg.test.backgroundColor
  );

  rerender(
    <ThemeProvider themePreference="light">
      <Heading bg="test">Hi</Heading>
    </ThemeProvider>
  );

  const lightThemeRender: any = toJSON();

  expect(lightThemeRender.props.style.backgroundColor).toEqual(
    selectors.light.bg.test.backgroundColor
  );
});

test('it handles ad-hoc selectors as props', () => {
  const Heading = create(Text, {});

  const selectors = { dark: { backgroundColor: 'red' }, light: { backgroundColor: 'blue' } };

  const { toJSON, rerender } = render(
    <ThemeProvider themePreference="dark">
      <Heading selectors={selectors} />
    </ThemeProvider>
  );

  const darkThemeRender: any = toJSON();
  expect(darkThemeRender.props.style).toEqual(selectors.dark);

  rerender(
    <ThemeProvider themePreference="light">
      <Heading selectors={selectors} />
    </ThemeProvider>
  );

  const lightThemeRender: any = toJSON();
  expect(lightThemeRender.props.style).toEqual(selectors.light);
});

test('it does not pass props that have a variant of the same name to components', () => {
  const Box = create(View, {
    variants: {
      width: {
        test: { width: 24 },
      },
    },
  });

  const { toJSON } = render(<Box width="test" />);
  const output: any = toJSON();
  expect(output.props.width).toBeUndefined();
});
