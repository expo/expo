import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Image } from '../Image';

it('falls back to the source size for a size key that is undefined in the style', async () => {
  const { getByTestId } = await render(
    <Image
      testID="image"
      source={{ uri: 'file:///image.png', width: 100, height: 50 }}
      style={{ width: undefined, height: undefined }}
    />
  );
  expect(StyleSheet.flatten(getByTestId('image').props.style)).toMatchObject({
    width: 100,
    height: 50,
  });
});
