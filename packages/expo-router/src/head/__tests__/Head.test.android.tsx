import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Head } from '../ExpoHead';

it('does not render Head children on Android', () => {
  const { toJSON } = render(
    <Head>
      <Text>Ignored child</Text>
    </Head>
  );

  expect(toJSON()).toBeNull();
});

it('renders children through Head.Provider on Android', () => {
  const { getByText } = render(
    <Head.Provider>
      <Text>Provider child</Text>
    </Head.Provider>
  );

  expect(getByText('Provider child')).toBeVisible();
});
