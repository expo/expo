import { act, fireEvent, screen } from '@testing-library/react-native';
import { useState, type ReactNode, type Ref } from 'react';
import { Text } from 'react-native';

import { navigationRef } from '../../global-state/navigationRef';
import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import { Link } from '../../link';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitView } from '../split-view';
import { useSplitView } from '../useSplitView';

const mockShow = jest.fn();

jest.mock('../../optional-libraries/react-native-screens', () => {
  const { useImperativeHandle }: typeof import('react') = jest.requireActual('react');
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../../optional-libraries/react-native-screens'
  ) as typeof import('../../optional-libraries/react-native-screens');

  return {
    ...actual,
    Split: {
      ...actual.Split,
      Host: ({
        ref,
        ...props
      }: {
        ref?: Ref<{ show: (column: string) => void }>;
        children?: ReactNode;
      }) => {
        useImperativeHandle(ref, () => ({ show: mockShow }), []);
        return <View testID="Split.Host" {...props} />;
      },
      Column: (props: { children?: ReactNode }) => <View testID="Split.Column" {...props} />,
    },
  };
});

afterEach(() => {
  mockShow.mockClear();
});

it('shows the column of router.navigate in a compact layout', async () => {
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
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('secondary');
});

it('shows the column of router.push in a compact layout', async () => {
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
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await act(() => router.push('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('secondary');
  warn.mockRestore();
});

it('shows the column of router.replace in a compact layout', async () => {
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
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await act(() => router.replace('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('secondary');
});

it('shows the column of a Link in a compact layout', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Link testID="link" href="/42" splitViewColumnName="secondary">
              Open message
            </Link>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/' }
  );
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await fireEvent.press(screen.getByTestId('link'));

  expect(screen).toHavePathname('/42');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('secondary');
});

it('shows the column of router.setParams and keeps the selected route', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/42' }
  );
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await act(() => router.setParams({ folder: 'sent' }, { splitViewColumnName: 'supplementary' }));

  expect(screen).toHavePathnameWithParams('/42?folder=sent');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('supplementary');
});

it('shows the column of a navigation to the current URL', async () => {
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
    { initialUrl: '/42' }
  );
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('secondary');
});

it('keeps the column when router.setParams has no column', async () => {
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

  await act(() => router.setParams({ sort: 'newest' }));

  expect(screen).toHavePathnameWithParams('/42?sort=newest');
  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('secondary');
});

it('sets the column for the next collapse and does not call native show in an expanded layout', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView topColumnForCollapsing="primary">
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/' }
  );
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');
  await fireEvent(screen.getByTestId('Split.Host'), 'expand');

  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('secondary');
  expect(mockShow).not.toHaveBeenCalled();
});

it('passes the initial topColumnForCollapsing to native and ignores later changes', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        const [column, setColumn] = useState<'primary' | 'secondary'>('primary');
        return (
          <SplitView topColumnForCollapsing={column}>
            <SplitView.Column>
              <Text testID="change" onPress={() => setColumn('secondary')}>
                Change
              </Text>
            </SplitView.Column>
            <SplitView.Content />
          </SplitView>
        );
      },
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );
  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('primary');

  await fireEvent.press(screen.getByTestId('change'));

  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('primary');
});

it('passes the column of the navigation that mounts the SplitView to native as topColumnForCollapsing', async () => {
  await renderRouter(
    {
      _layout: () => <Slot />,
      outside: () => <Text>Outside</Text>,
      '(split)/_layout': () => (
        <SplitView topColumnForCollapsing="primary">
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      '(split)/[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/outside' }
  );

  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));

  expect(screen).toHavePathname('/42');
  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('secondary');
  expect(mockShow).not.toHaveBeenCalled();
});

it('makes the single visible column of a collapsed layout the compact column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView topColumnForCollapsing="secondary">
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );
  // The first Split.Column is the primary column. The second is the secondary column.
  const [primary, secondary] = screen.getAllByTestId('Split.Column');
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');
  await fireEvent(secondary!, 'didAppear');

  // Native column back.
  await fireEvent(primary!, 'willAppear');
  await fireEvent(secondary!, 'willDisappear');
  await fireEvent(primary!, 'didAppear');
  await fireEvent(secondary!, 'didDisappear');

  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('primary');
});

it('keeps the compact column when a column appears before the layout expands', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView topColumnForCollapsing="secondary">
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );
  // The first Split.Column is the primary column. The second is the secondary column.
  const [primary, secondary] = screen.getAllByTestId('Split.Column');
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');
  await fireEvent(secondary!, 'didAppear');

  // Native sends the appearance of the primary column before `onExpand`.
  await fireEvent(primary!, 'willAppear');
  await fireEvent(primary!, 'didAppear');
  await fireEvent(screen.getByTestId('Split.Host'), 'expand');

  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('secondary');
});

it('shows the last requested column after the column transition ends', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView topColumnForCollapsing="primary">
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/' }
  );
  // The first Split.Column is the primary column. The second is the secondary column.
  const [primary, secondary] = screen.getAllByTestId('Split.Column');
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');
  await fireEvent(primary!, 'didAppear');
  await act(() => router.navigate('/42', { splitViewColumnName: 'secondary' }));
  await fireEvent(secondary!, 'willAppear');
  await fireEvent(primary!, 'willDisappear');

  await act(() => router.navigate('/43', { splitViewColumnName: 'primary' }));
  expect(mockShow).toHaveBeenCalledTimes(1);
  await fireEvent(secondary!, 'didAppear');
  await fireEvent(primary!, 'didDisappear');

  expect(mockShow).toHaveBeenCalledTimes(2);
  expect(mockShow).toHaveBeenNthCalledWith(1, 'secondary');
  expect(mockShow).toHaveBeenNthCalledWith(2, 'primary');
  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('primary');
});

it('warns about a column that the SplitView does not have and still navigates', async () => {
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
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await act(() => router.navigate('/42', { splitViewColumnName: 'supplementary' }));

  expect(screen).toHavePathname('/42');
  expect(warn).toHaveBeenCalledWith(
    'SplitView cannot show the "supplementary" column, because it has only these columns: "primary", "secondary". Request one of these columns, or add a SplitView.Column.'
  );
  expect(mockShow).not.toHaveBeenCalled();
  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBeUndefined();
  warn.mockRestore();
});

it('returns the compact state from useSplitView', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        function State() {
          const { isCollapsed, compactColumn } = useSplitView();
          return <Text testID="state">{`${isCollapsed} ${compactColumn}`}</Text>;
        }
        return (
          <SplitView topColumnForCollapsing="primary">
            <SplitView.Column>
              <State />
            </SplitView.Column>
            <SplitView.Content />
          </SplitView>
        );
      },
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );
  expect(screen.getByTestId('state')).toHaveTextContent('false primary');

  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  expect(screen.getByTestId('state')).toHaveTextContent('true primary');
});

it('returns undefined compactColumn from useSplitView before a column is known', async () => {
  await renderRouter(
    {
      index: function Index() {
        const { compactColumn } = useSplitView();
        return <Text testID="state">{`${compactColumn}`}</Text>;
      },
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
    },
    { initialUrl: '/' }
  );

  expect(screen.getByTestId('state')).toHaveTextContent('undefined');
});

it('shows the column of useSplitView().show in a compact layout', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: function Index() {
        const { show } = useSplitView();
        return (
          <Text testID="show" onPress={() => show('primary')}>
            Show
          </Text>
        );
      },
    },
    { initialUrl: '/' }
  );
  await fireEvent(screen.getByTestId('Split.Host'), 'collapse');

  await fireEvent.press(screen.getByTestId('show'));

  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockShow).toHaveBeenCalledWith('primary');
});

it('sets the column of useSplitView().show for the next collapse in an expanded layout', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: function Index() {
        const { show } = useSplitView();
        return (
          <Text testID="show" onPress={() => show('primary')}>
            Show
          </Text>
        );
      },
    },
    { initialUrl: '/' }
  );

  await fireEvent.press(screen.getByTestId('show'));

  expect(screen.getByTestId('Split.Host').props.topColumnForCollapsing).toBe('primary');
  expect(mockShow).not.toHaveBeenCalled();
});

it('throws when useSplitView is used outside a SplitView', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: function Layout() {
            useSplitView();
            return (
              <SplitView>
                <SplitView.Column />
                <SplitView.Content />
              </SplitView>
            );
          },
          index: () => <Text>Index</Text>,
        },
        { initialUrl: '/' }
      )
  ).rejects.toThrow(
    'useSplitView must be used inside a SplitView column or route. The layout that renders SplitView is outside the SplitView. Move the component into a SplitView.Column or a route, or use the SplitView ref.'
  );
  jest.mocked(console.error).mockRestore();
});

it('keeps one route in the SplitView after router.navigate', async () => {
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

  await act(() => router.navigate('/42'));

  expect(screen).toHavePathname('/42');
  // The first root route renders the root layout, which is the SplitView.
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    '[mailId]',
  ]);
  expect(router.canGoBack()).toBe(false);
});

it('keeps one route in the SplitView after router.push', async () => {
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

  await act(() => router.push('/42'));
  await act(() => router.push('/43'));

  expect(screen).toHavePathname('/43');
  // The first root route renders the root layout, which is the SplitView.
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    '[mailId]',
  ]);
  expect(router.canGoBack()).toBe(false);
  warn.mockRestore();
});

it('keeps the history of a Stack in a SplitView route', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
      'bluetooth/_layout': () => <Stack />,
      'bluetooth/index': () => <Text>Bluetooth</Text>,
      'bluetooth/[deviceId]': () => <Text>Device</Text>,
    },
    { initialUrl: '/bluetooth' }
  );

  await act(() => router.push('/bluetooth/123'));
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());

  expect(screen).toHavePathname('/bluetooth');
});

it('keeps the anchor route but cannot go back', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: {
        default: () => (
          <SplitView>
            <SplitView.Column />
            <SplitView.Content />
          </SplitView>
        ),
        unstable_settings: { anchor: 'index' },
      },
      index: () => <Text>Index</Text>,
      '[mailId]': () => <Text>Mail</Text>,
    },
    { initialUrl: '/42' }
  );

  // The first root route renders the root layout, which is the SplitView.
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
    '[mailId]',
  ]);
  expect(router.canGoBack()).toBe(false);
  warn.mockRestore();
});
