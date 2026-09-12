import { render } from '@testing-library/react-native';

import { NavigationSplitView } from '..';
import { Text } from '../../Text';
import { opacity } from '../../modifiers';

const mockNativeViewFn = jest.fn();
const mockSlotFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((...args) => {
    const { View } = require('react-native');
    const { createElement } = require('react');
    if (args[0] !== 'ExpoUI') {
      throw new Error(`Unexpected native module requested: ${args[0]}`);
    }
    if (args[1] === 'SlotView') {
      return (props: any) => {
        mockSlotFn(props);
        return createElement(View, props);
      };
    }
    if (args[1] === 'NavigationSplitViewView') {
      return (props: any) => {
        mockNativeViewFn(props);
        return createElement(View, props);
      };
    }
    return (props: any) => createElement(View, props);
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
  mockSlotFn.mockClear();
});

function nativeProps() {
  return mockNativeViewFn.mock.calls[0][0];
}

function slotNames() {
  return mockSlotFn.mock.calls.map((call) => call[0].name);
}

describe('NavigationSplitView', () => {
  it('places the sidebar and the detail in their named slots', () => {
    render(
      <NavigationSplitView>
        <NavigationSplitView.Sidebar>
          <Text>Folders</Text>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    expect(slotNames()).toEqual(['sidebar', 'detail']);
  });

  it('places the optional middle column in the content slot', () => {
    render(
      <NavigationSplitView>
        <NavigationSplitView.Sidebar>
          <Text>Folders</Text>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Content>
          <Text>Notes</Text>
        </NavigationSplitView.Content>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    expect(slotNames()).toEqual(['sidebar', 'content', 'detail']);
  });

  it('passes the column preferences to the native view', () => {
    render(
      <NavigationSplitView columnVisibility="doubleColumn" preferredCompactColumn="detail">
        <NavigationSplitView.Sidebar>
          <Text>Folders</Text>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    expect(nativeProps().columnVisibility).toBe('doubleColumn');
    expect(nativeProps().preferredCompactColumn).toBe('detail');
  });

  it('unwraps the native column visibility event', () => {
    const onColumnVisibilityChange = jest.fn();
    render(
      <NavigationSplitView onColumnVisibilityChange={onColumnVisibilityChange}>
        <NavigationSplitView.Sidebar>
          <Text>Folders</Text>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    nativeProps().onColumnVisibilityChange({ nativeEvent: { visibility: 'detailOnly' } });
    expect(onColumnVisibilityChange).toHaveBeenCalledWith('detailOnly');
  });

  it('unwraps the native compact column event', () => {
    const onPreferredCompactColumnChange = jest.fn();
    render(
      <NavigationSplitView onPreferredCompactColumnChange={onPreferredCompactColumnChange}>
        <NavigationSplitView.Sidebar>
          <Text>Folders</Text>
        </NavigationSplitView.Sidebar>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    nativeProps().onPreferredCompactColumnChange({ nativeEvent: { column: 'content' } });
    expect(onPreferredCompactColumnChange).toHaveBeenCalledWith('content');
  });

  it('attaches the global event listener only when the user passes modifiers', () => {
    render(
      <NavigationSplitView>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    render(
      <NavigationSplitView modifiers={[opacity(0.5)]}>
        <NavigationSplitView.Detail>
          <Text>Note</Text>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    );
    expect(mockNativeViewFn.mock.calls[0][0].onGlobalEvent).toBeUndefined();
    expect(mockNativeViewFn.mock.calls[1][0].onGlobalEvent).toBeInstanceOf(Function);
  });
});
