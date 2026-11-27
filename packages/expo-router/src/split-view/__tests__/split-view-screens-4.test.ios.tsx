import { Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import { SplitView } from '../split-view';

jest.mock('../../optional-libraries/react-native-screens', () => ({
  ...jest.requireActual('../../optional-libraries/react-native-screens'),
  isScreens5: false,
}));

it('rejects a SplitView with react-native-screens 4', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column />
            <SplitView.Content />
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow(
    'SplitView requires react-native-screens 5. The installed version is older and does not have the Split and Stack integration. Install react-native-screens 5.0.0-beta.2 or newer.'
  );
});
