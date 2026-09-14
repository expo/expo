import { render } from '@testing-library/react-native';
import * as React from 'react';

import { registerSynchronousCollectionRenderer } from '../registerSynchronousCollectionRenderer';

let mockNativeProps: { rendererId: string; itemCount: number; revision: number };
jest.mock('expo', () => ({
  requireNativeView: () => (props: typeof mockNativeProps) => {
    mockNativeProps = props;
    return null;
  },
}));
jest.mock('react-native/Libraries/Renderer/shims/ReactFabric', () => ({
  default: {
    render: jest.fn(),
    unmountComponentAtNode: jest.fn(),
  },
}));

const fabric = require('react-native/Libraries/Renderer/shims/ReactFabric').default;
const globals = globalThis as typeof globalThis & {
  __ExpoUIRenderSyncCollectionRow: (id: string, root: number, index: number) => boolean;
  __ExpoUIUnmountSyncCollectionRow: (root: number) => void;
};

beforeEach(() => {
  jest.clearAllMocks();
  fabric.render.mockImplementation((_element: unknown, _root: number, commit: () => void) =>
    commit()
  );
});

it('does no React work before native requests an index and keeps list registrations isolated', () => {
  const first = jest.fn(() => <React.Fragment />);
  const second = jest.fn(() => <React.Fragment />);
  const a = registerSynchronousCollectionRenderer(first);
  const b = registerSynchronousCollectionRenderer(second);
  expect(first).not.toHaveBeenCalled();
  expect(second).not.toHaveBeenCalled();
  expect(globals.__ExpoUIRenderSyncCollectionRow(b.rendererId, 11, 9999)).toBe(true);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith(9999);
  a.dispose();
  b.dispose();
});

it('reuses the root and subtree key across row indices', () => {
  const registration = registerSynchronousCollectionRenderer(() => <React.Fragment />);
  globals.__ExpoUIRenderSyncCollectionRow(registration.rendererId, 11, 0);
  globals.__ExpoUIRenderSyncCollectionRow(registration.rendererId, 11, 1);
  const [first, second] = fabric.render.mock.calls;
  expect(first[1]).toBe(second[1]);
  expect(first[0].key).toBe(second[0].key);
  expect(first[3]).toBe(false);
  registration.dispose();
});

it('reports an unfinished commit and rejects requests after disposal', () => {
  fabric.render.mockImplementation(() => {});
  const registration = registerSynchronousCollectionRenderer(() => <React.Fragment />);
  expect(globals.__ExpoUIRenderSyncCollectionRow(registration.rendererId, 11, 0)).toBe(false);
  registration.dispose();
  expect(() => globals.__ExpoUIRenderSyncCollectionRow(registration.rendererId, 11, 0)).toThrow(
    'is no longer registered'
  );
  // Native teardown still works after the renderer registration is removed.
  globals.__ExpoUIUnmountSyncCollectionRow(11);
  expect(fabric.unmountComponentAtNode).toHaveBeenCalledWith(11);
});

it('updates recycled row components without remounting', () => {
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function Row({ index }: { index: number }) {
    React.useEffect(() => {
      mounted();
      return unmounted;
    }, []);
    return <React.Fragment>{index}</React.Fragment>;
  }
  const registration = registerSynchronousCollectionRenderer((index) => <Row index={index} />);
  globals.__ExpoUIRenderSyncCollectionRow(registration.rendererId, 11, 0);
  const tree = render(fabric.render.mock.calls[0][0]);
  globals.__ExpoUIRenderSyncCollectionRow(registration.rendererId, 11, 1);
  tree.rerender(fabric.render.mock.calls[1][0]);
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(unmounted).not.toHaveBeenCalled();
  tree.unmount();
  registration.dispose();
});

it('owns registration, renders data lazily, refreshes rows, and disposes on unmount', () => {
  const { SynchronousCollectionList } = require('..');
  const data = Array.from({ length: 10000 }, (_, index) => ({ title: `Item ${index}` }));
  const renderItem = jest.fn(({ item }) => <React.Fragment>{item.title}</React.Fragment>);
  const screen = render(<SynchronousCollectionList data={data} renderItem={renderItem} />);
  const id = mockNativeProps.rendererId;
  const revision = mockNativeProps.revision;
  expect(mockNativeProps.itemCount).toBe(10000);
  expect(renderItem).not.toHaveBeenCalled();
  globals.__ExpoUIRenderSyncCollectionRow(id, 11, 9999);
  expect(renderItem).toHaveBeenLastCalledWith({ item: data[9999], index: 9999 });
  const firstKey = fabric.render.mock.calls.at(-1)[0].key;
  globals.__ExpoUIRenderSyncCollectionRow(id, 11, 1);
  expect(fabric.render.mock.calls.at(-1)[0].key).toBe(firstKey);

  const updated = [{ title: 'Updated' }];
  screen.rerender(<SynchronousCollectionList data={updated} renderItem={renderItem} />);
  expect(mockNativeProps.rendererId).toBe(id);
  expect(mockNativeProps.itemCount).toBe(1);
  expect(mockNativeProps.revision).toBeGreaterThan(revision);
  globals.__ExpoUIRenderSyncCollectionRow(id, 11, 0);
  expect(renderItem).toHaveBeenLastCalledWith({ item: updated[0], index: 0 });

  const replacement = jest.fn(() => <React.Fragment>New callback</React.Fragment>);
  screen.rerender(
    <SynchronousCollectionList data={updated} renderItem={replacement} extraData={1} />
  );
  globals.__ExpoUIRenderSyncCollectionRow(id, 11, 0);
  expect(replacement).toHaveBeenCalledTimes(1);
  const beforeExtraData = mockNativeProps.revision;
  screen.rerender(
    <SynchronousCollectionList data={updated} renderItem={replacement} extraData={2} />
  );
  expect(mockNativeProps.revision).toBeGreaterThan(beforeExtraData);
  const stableRevision = mockNativeProps.revision;
  screen.rerender(
    <SynchronousCollectionList data={updated} renderItem={replacement} extraData={2} />
  );
  expect(mockNativeProps.revision).toBe(stableRevision);

  screen.unmount();
  expect(() => globals.__ExpoUIRenderSyncCollectionRow(id, 11, 0)).toThrow('no longer registered');
});

it('handles empty data and reuses the subtree when populated', () => {
  const { SynchronousCollectionList } = require('..');
  const renderItem = jest.fn(() => <React.Fragment />);
  const screen = render(<SynchronousCollectionList data={[]} renderItem={renderItem} />);
  expect(mockNativeProps.itemCount).toBe(0);
  expect(renderItem).not.toHaveBeenCalled();
  const id = mockNativeProps.rendererId;
  screen.rerender(<SynchronousCollectionList data={[1, 2]} renderItem={renderItem} />);
  globals.__ExpoUIRenderSyncCollectionRow(id, 11, 0);
  globals.__ExpoUIRenderSyncCollectionRow(id, 11, 1);
  const calls = fabric.render.mock.calls;
  expect(calls.at(-1)[0].key).toBe(calls.at(-2)[0].key);
  screen.unmount();
});

it('rejects a missing item before calling renderItem', () => {
  const { SynchronousCollectionList } = require('..');
  const renderItem = jest.fn(() => <React.Fragment />);
  const screen = render(<SynchronousCollectionList data={['row']} renderItem={renderItem} />);
  expect(() => globals.__ExpoUIRenderSyncCollectionRow(mockNativeProps.rendererId, 11, 1)).toThrow(
    'missing item at index 1'
  );
  expect(renderItem).not.toHaveBeenCalled();
  screen.unmount();
});
