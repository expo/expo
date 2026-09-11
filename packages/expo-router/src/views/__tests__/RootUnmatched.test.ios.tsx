import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import * as SplashScreen from '../../utils/splash';
import { Unmatched } from '../Unmatched';

jest.mock('../../utils/splash', () => {
  const actualSplash = jest.requireActual(
    '../../utils/splash'
  ) as typeof import('../../utils/splash');
  return {
    ...actualSplash,
    hideAsync: jest.fn(),
  };
});

it('hides the splash screen when the root router falls back to the built-in unmatched screen', () => {
  renderRouter(
    {
      index: () => null,
    },
    {
      initialUrl: '/404',
    }
  );

  expect(screen.getByText('Unmatched Route')).toBeOnTheScreen();
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
});

it('does not hide the splash screen when a route matches', () => {
  renderRouter({
    index: () => <Text>Hello</Text>,
  });

  expect(screen.getByText('Hello')).toBeOnTheScreen();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
});

it('does not hide the splash screen when a user-defined +not-found matches', () => {
  renderRouter(
    {
      index: () => null,
      '+not-found': () => <Text>Custom not found</Text>,
    },
    {
      initialUrl: '/404',
    }
  );

  expect(screen.getByText('Custom not found')).toBeOnTheScreen();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
});

it('does not hide the splash screen when the app renders Unmatched itself inside its own layout', () => {
  renderRouter(
    {
      index: () => null,
      '+not-found': () => <Unmatched />,
    },
    {
      initialUrl: '/404',
    }
  );

  expect(screen.getByText('Unmatched Route')).toBeOnTheScreen();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
});
