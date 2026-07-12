import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Head } from '../ExpoHead';

it('renders as a no-op on Android', () => {
  const { toJSON } = render(
    <Head>
      <Text>Ignored child</Text>
    </Head>
  );

  expect(toJSON()).toBeNull();
  expect(Head.Provider).toBeDefined();
});
