import 'react-native';
import { render } from '@testing-library/react-native';

import { HR } from '../Rules';

it('renders HR', () => {
  const { toJSON } = render(<HR />);
  expect(toJSON()).toMatchSnapshot();
});
