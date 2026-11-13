import 'react-native';
import { render } from '@testing-library/react-native';

import { A } from '../Anchor';

it('renders A', async () => {
  const { toJSON } = await render(<A href="#" target="_parent" />);
  expect(toJSON()).toMatchSnapshot();
});
