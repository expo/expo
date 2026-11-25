import 'react-native';
import { render } from '@testing-library/react-native';

import { HR } from '../Rules';

it('renders HR', async () => {
  const { toJSON } = await render(<HR />);
  expect(toJSON()).toMatchSnapshot();
});
