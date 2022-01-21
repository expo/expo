import * as React from 'react';

import { render, waitFor } from '../../test-utils';
import { MainScreen } from '../MainScreen';

describe('<DevMenu />', () => {
  test('renders', async () => {
    const { getByText } = render(<MainScreen />);
    await waitFor(() => getByText(/go home/i));
  });
});
