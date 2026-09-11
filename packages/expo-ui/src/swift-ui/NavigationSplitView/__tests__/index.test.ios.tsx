import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { NavigationSplitView } from '..';
import { opacity } from '../../modifiers';

const mockNativeViewProps = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((_moduleName, viewName) => {
    const { View } = require('react-native');
    const { createElement } = require('react');
    return (props: any) => {
      if (viewName === 'NavigationSplitView') {
        mockNativeViewProps(props);
      }
      return createElement(View, props);
    };
  }),
}));

beforeEach(() => {
  mockNativeViewProps.mockClear();
});

describe('NavigationSplitView', () => {
  it('renders sidebar and detail slots for two columns', () => {
    render(
      <NavigationSplitView sidebar={<Text>Sidebar</Text>}>
        <Text>Detail</Text>
      </NavigationSplitView>
    );

    expect(
      mockNativeViewProps.mock.calls[0][0].children
        .filter(Boolean)
        .map((child: any) => child.props.name)
    ).toEqual(['sidebar', 'detail']);
  });

  it('renders sidebar, content, and detail slots for three columns', () => {
    render(
      <NavigationSplitView sidebar={<Text>Sidebar</Text>} content={<Text>Content</Text>}>
        <Text>Detail</Text>
      </NavigationSplitView>
    );

    expect(
      mockNativeViewProps.mock.calls[0][0].children.map((child: any) => child.props.name)
    ).toEqual(['sidebar', 'content', 'detail']);
  });

  it('unwraps native change events', () => {
    const onColumnVisibilityChange = jest.fn();
    const onPreferredCompactColumnChange = jest.fn();

    render(
      <NavigationSplitView
        sidebar={<Text>Sidebar</Text>}
        columnVisibility="all"
        onColumnVisibilityChange={onColumnVisibilityChange}
        preferredCompactColumn="detail"
        onPreferredCompactColumnChange={onPreferredCompactColumnChange}>
        <Text>Detail</Text>
      </NavigationSplitView>
    );

    const props = mockNativeViewProps.mock.calls[0][0];
    props.onColumnVisibilityChange({ nativeEvent: { columnVisibility: 'detailOnly' } });
    props.onPreferredCompactColumnChange({ nativeEvent: { preferredCompactColumn: 'sidebar' } });

    expect(onColumnVisibilityChange).toHaveBeenCalledWith('detailOnly');
    expect(onPreferredCompactColumnChange).toHaveBeenCalledWith('sidebar');
  });

  it('attaches the global event listener when modifiers are provided', () => {
    render(
      <NavigationSplitView sidebar={<Text>Sidebar</Text>} modifiers={[opacity(0.5)]}>
        <Text>Detail</Text>
      </NavigationSplitView>
    );

    expect(mockNativeViewProps.mock.calls[0][0].onGlobalEvent).toBeInstanceOf(Function);
  });
});
