import { act, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import { renderRouter } from '../../testing-library';
import { SplitView } from '../split-view';
import { useSplitView } from '../useSplitView';

it('returns an inactive state from useSplitView', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView topColumnForCollapsing="primary">
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: function Index() {
        const { show, isCollapsed, compactColumn } = useSplitView();
        return (
          <Text testID="state" onPress={() => show('primary')}>
            {`${isCollapsed} ${compactColumn}`}
          </Text>
        );
      },
    },
    { initialUrl: '/' }
  );

  await fireEvent.press(screen.getByTestId('state'));

  expect(screen.getByTestId('state')).toHaveTextContent('false undefined');
  warn.mockRestore();
});

it('keeps the route history and ignores the column request', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/' }
  );

  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(router.canGoBack()).toBe(true);
  // The fallback warns on each render that SplitView is iOS only. It does not warn about the column request.
  expect(warn).not.toHaveBeenCalledWith(
    'No SplitView received the "secondary" column request from splitViewColumnName, because no SplitView is mounted. Remove splitViewColumnName, or navigate to a route inside a SplitView.'
  );
  warn.mockRestore();
});
