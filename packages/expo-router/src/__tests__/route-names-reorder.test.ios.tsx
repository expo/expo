import { act, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';

import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

it.each([
  ['Stack', Stack],
  ['Tabs', Tabs],
] as const)('%s does not throw when Screen order changes after mount', (_, Navigator) => {
  let flip!: Dispatch<SetStateAction<boolean>>;

  renderRouter(
    {
      _layout: function Layout() {
        const [flipped, setFlipped] = useState(false);
        flip = setFlipped;
        const names = flipped ? ['b', 'a'] : ['a', 'b'];
        return (
          <Navigator id={undefined}>
            {names.map((name) => (
              <Navigator.Screen key={name} name={name} />
            ))}
          </Navigator>
        );
      },
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(screen.getByTestId('a')).toBeVisible();

  expect(() => act(() => flip(true))).not.toThrow();

  // The focused screen and its state survive the reorder.
  expect(screen.getByTestId('a')).toBeVisible();
});

it.each([
  ['Stack', Stack],
  ['Tabs', Tabs],
] as const)(
  '%s does not throw when a Screen declaration is removed and added back after mount',
  (_, Navigator) => {
    let setNames!: Dispatch<SetStateAction<string[]>>;

    renderRouter(
      {
        _layout: function Layout() {
          // Undeclared filesystem routes are appended after the declared ones, so
          // removing a declaration only reorders route names, it never removes them.
          const [names, setNamesState] = useState(['a', 'b']);
          setNames = setNamesState;
          return (
            <Navigator id={undefined}>
              {names.map((name) => (
                <Navigator.Screen key={name} name={name} />
              ))}
            </Navigator>
          );
        },
        a: () => <Text testID="a">A</Text>,
        b: () => <Text testID="b">B</Text>,
      },
      { initialUrl: '/a' }
    );

    expect(screen.getByTestId('a')).toBeVisible();

    expect(() => act(() => setNames(['b']))).not.toThrow();
    expect(screen.getByTestId('a')).toBeVisible();

    expect(() => act(() => setNames(['a', 'b']))).not.toThrow();
    expect(screen.getByTestId('a')).toBeVisible();
  }
);
