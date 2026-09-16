import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import ReactFabric from 'react-native/Libraries/Renderer/shims/ReactFabric';

import { SyncList } from '..';
import { createSyncListId, registerSyncListRenderer, renderSyncListCell } from '../renderer';

const mockNativeView = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: () => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: any) => {
      mockNativeView(props);
      return createElement(View, props);
    };
  },
}));

jest.mock('react-native/Libraries/Renderer/shims/ReactFabric', () => ({
  __esModule: true,
  default: { render: jest.fn(), unmountComponentAtNode: jest.fn() },
}));

function nativeProps() {
  return mockNativeView.mock.calls[mockNativeView.mock.calls.length - 1][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(ReactFabric.render).mockImplementation((_element, _tag, callback) => callback?.());
});

it('refreshes the native renderer version when data changes without changing the count', () => {
  const screen = render(<SyncList itemCount={1} renderItem={() => <View testID="before" />} />);
  const before = nativeProps();
  expect(renderSyncListCell(before.listId, 21, 0, before.renderVersion)).toBe(true);

  screen.rerender(<SyncList itemCount={1} renderItem={() => <View testID="after" />} />);
  const after = nativeProps();
  expect(after.listId).toBe(before.listId);
  expect(after.renderVersion).not.toBe(before.renderVersion);
  expect(renderSyncListCell(after.listId, 21, 0, after.renderVersion)).toBe(true);
  expect(ReactFabric.render).toHaveBeenLastCalledWith(
    <View testID="after" />,
    21,
    expect.any(Function),
    false,
    null
  );
  // A request already in flight must not consume the newer callback with older native props.
  expect(renderSyncListCell(before.listId, 21, 0, before.renderVersion)).toBeNull();
});

it('does not refresh native rows for an unrelated parent render with identical inputs', () => {
  const renderItem = () => <View />;
  const screen = render(<SyncList itemCount={1} renderItem={renderItem} />);
  const before = nativeProps();
  screen.rerender(<SyncList itemCount={1} renderItem={renderItem} />);
  expect(nativeProps().renderVersion).toBe(before.renderVersion);
});

it('retires old-count requests and never calls the renderer with a removed index', () => {
  const renderItem = jest.fn(() => <View />);
  const screen = render(<SyncList itemCount={3} renderItem={renderItem} />);
  const before = nativeProps();
  screen.rerender(<SyncList itemCount={1} renderItem={renderItem} />);
  const after = nativeProps();
  expect(after.renderVersion).not.toBe(before.renderVersion);
  expect(renderSyncListCell(before.listId, 21, 2, before.renderVersion)).toBeNull();
  expect(renderSyncListCell(after.listId, 21, 2, after.renderVersion)).toBeNull();
  expect(renderItem).not.toHaveBeenCalled();
});

it('returns retirement rather than a render failure after unmount', () => {
  const screen = render(<SyncList itemCount={1} renderItem={() => <View />} />);
  const props = nativeProps();
  screen.unmount();
  expect(renderSyncListCell(props.listId, 21, 0, props.renderVersion)).toBeNull();
  expect(ReactFabric.render).not.toHaveBeenCalled();
});

it('keeps a synchronous commit failure distinct from retirement', () => {
  jest.mocked(ReactFabric.render).mockImplementation(() => undefined);
  const screen = render(<SyncList itemCount={1} renderItem={() => <View />} />);
  const props = nativeProps();
  expect(renderSyncListCell(props.listId, 21, 0, props.renderVersion)).toBe(false);
  screen.unmount();
});

it('does not let an old cleanup unregister a replacement renderer', () => {
  const id = createSyncListId();
  const cleanOld = registerSyncListRenderer(id, () => <View />, 1, 0);
  const cleanNew = registerSyncListRenderer(id, () => <View testID="new" />, 1, 1);
  cleanOld();
  expect(renderSyncListCell(id, 21, 0, 1)).toBe(true);
  cleanNew();
  expect(renderSyncListCell(id, 21, 0, 1)).toBeNull();
});
