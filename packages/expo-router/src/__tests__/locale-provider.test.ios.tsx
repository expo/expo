import { fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Button, Text } from 'react-native';

import { LocaleProvider, Stack } from '../index';
import { useLocale } from '../react-navigation/native/useLocale';
import { renderRouter } from '../testing-library';

function Layout() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  return (
    <LocaleProvider direction={direction}>
      <Button title="Toggle direction" onPress={() => setDirection('rtl')} />
      <Stack />
    </LocaleProvider>
  );
}

function Index() {
  const { direction } = useLocale();

  return <Text testID="direction">{direction}</Text>;
}

it('provides locale direction to navigators and updates it at runtime', () => {
  renderRouter({
    _layout: Layout,
    index: Index,
  });

  expect(screen.getByTestId('direction')).toHaveTextContent('ltr');

  fireEvent.press(screen.getByRole('button', { name: 'Toggle direction' }));

  expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
});
