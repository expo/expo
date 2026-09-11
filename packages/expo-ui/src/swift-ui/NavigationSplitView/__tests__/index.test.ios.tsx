import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { NavigationSplitView } from '..';

const mockNativeView = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((_moduleName, viewName) => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: Record<string, unknown>) => {
      mockNativeView(viewName, props);
      return createElement(View, props);
    };
  }),
}));

it('passes navigation state to the native split view', () => {
  const onColumnVisibilityChange = jest.fn();
  const onPreferredCompactColumnChange = jest.fn();

  render(
    <NavigationSplitView
      columnVisibility="all"
      preferredCompactColumn="content"
      onColumnVisibilityChange={onColumnVisibilityChange}
      onPreferredCompactColumnChange={onPreferredCompactColumnChange}>
      <NavigationSplitView.Sidebar>
        <Text>Sidebar</Text>
      </NavigationSplitView.Sidebar>
      <NavigationSplitView.Content>
        <Text>Content</Text>
      </NavigationSplitView.Content>
      <NavigationSplitView.Detail>
        <Text>Detail</Text>
      </NavigationSplitView.Detail>
    </NavigationSplitView>
  );

  const props = mockNativeView.mock.calls.find(([name]) => name === 'NavigationSplitViewView')?.[1];
  expect(props).toMatchObject({ columnVisibility: 'all', preferredCompactColumn: 'content' });

  props?.onColumnVisibilityChange({ nativeEvent: { columnVisibility: 'doubleColumn' } });
  props?.onPreferredCompactColumnChange({ nativeEvent: { preferredCompactColumn: 'detail' } });

  expect(onColumnVisibilityChange).toHaveBeenCalledWith('doubleColumn');
  expect(onPreferredCompactColumnChange).toHaveBeenCalledWith('detail');
});
