import { act, render } from '@testing-library/react-native';
import { createContext, useContext, useState } from 'react';
import { Text, View } from 'react-native';

import { ListForEach, type ListForEachProps } from '../ListForEach';
import { getSlotIndices, getWindow } from '../window';

const mockList = jest.fn();
const mockSlot = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: (_module: string, name: string) => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: any) => {
      (name === 'DataListForEachView' || name === 'ListForEachView' ? mockList : mockSlot)(props);
      return createElement(View, props);
    };
  },
}));

const data = Array.from({ length: 10_000 }, (_, index) => ({
  id: `item-${index}`,
}));
const keyExtractor = (item: { id: string }) => item.id;
const nativeProps = () => mockList.mock.calls.at(-1)![0];
const slotsOf = (props: any) => props.children.props.children;
const requestWindow = (first: number, last: number, revision = nativeProps().revision) =>
  act(() => nativeProps().onWindowChange({ nativeEvent: { first, last, revision } }));

beforeEach(() => jest.clearAllMocks());

it('creates a bounded JSX window for 10,000 items and recenters after a distant request', () => {
  const renderItem = jest.fn(({ index }) => <Text>{index}</Text>);
  render(<ListForEach data={data} keyExtractor={keyExtractor} renderItem={renderItem} />);
  expect(renderItem).toHaveBeenCalledTimes(11);
  expect(nativeProps().itemKeys).toHaveLength(10_000);
  requestWindow(500, 510);
  expect(renderItem).toHaveBeenCalledTimes(42);
  const indices = slotsOf(nativeProps()).map((child: any) => child.props.index);
  expect(indices).toHaveLength(31);
  for (let index = 500; index <= 510; index++) expect(indices).toContain(index);
});

it('reuses overlapping slots without rerendering them and preserves parent context', () => {
  const Context = createContext('missing');
  let mounts = 0;
  function Row({ index }: { index: number }) {
    const [slot] = useState(() => mounts++);
    return <Text>{`${useContext(Context)}:${index}:${slot}`}</Text>;
  }
  const renderItem = jest.fn(({ index }) => <Row index={index} />);
  const screen = render(
    <Context.Provider value="parent">
      <ListForEach
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        overscanCount={3}
      />
    </Context.Provider>
  );
  requestWindow(10, 11);
  expect(mounts).toBe(8);
  const calls = renderItem.mock.calls.length;
  const slot = screen.getAllByText(/^parent:7:/)[0]!.props.children.split(':')[2];
  requestWindow(12, 13); // Two rows enter, reusing slots from rows 7 and 8.
  expect(renderItem).toHaveBeenCalledTimes(calls + 2);
  expect(mounts).toBe(8);
  expect(screen.getByText(`parent:15:${slot}`)).toBeTruthy();
  requestWindow(12, 13);
  expect(renderItem).toHaveBeenCalledTimes(calls + 2);
});

it('ignores stale events and updates same-key data without retaining old content', () => {
  const renderItem = ({ item }: { item: { id: string; title?: string } }) => (
    <Text>{item.title ?? item.id}</Text>
  );
  const screen = render(
    <ListForEach data={data} keyExtractor={keyExtractor} renderItem={renderItem} />
  );
  const revision = nativeProps().revision;
  const updated = [{ id: 'item-0', title: 'Updated' }, ...data.slice(1)];
  screen.rerender(
    <ListForEach data={updated} keyExtractor={keyExtractor} renderItem={renderItem} />
  );
  expect(screen.getByText('Updated')).toBeTruthy();
  expect(nativeProps().revision).not.toBe(revision);
  requestWindow(500, 510, revision);
  expect(slotsOf(nativeProps())[0].props.index).toBe(0);
});

it('clamps after shrinking, handles empty data, and rejects pre-resize requests', () => {
  const renderItem = ({ index }: { index: number }) => <Text>{index}</Text>;
  const screen = render(
    <ListForEach data={data} keyExtractor={keyExtractor} renderItem={renderItem} />
  );
  requestWindow(9900, 9905);
  const oldRevision = nativeProps().revision;
  screen.rerender(
    <ListForEach data={data.slice(0, 3)} keyExtractor={keyExtractor} renderItem={renderItem} />
  );
  expect(slotsOf(nativeProps()).map((child: any) => child.props.index)).toEqual([0, 1, 2]);
  requestWindow(9900, 9905, oldRevision);
  expect(slotsOf(nativeProps())).toHaveLength(3);
  screen.rerender(<ListForEach data={[]} keyExtractor={keyExtractor} renderItem={renderItem} />);
  expect(slotsOf(nativeProps())).toHaveLength(0);
});

it('preserves the window anchor across insertion and keeps its buffer', () => {
  const renderItem = () => <View />;
  const screen = render(
    <ListForEach data={data} keyExtractor={keyExtractor} renderItem={renderItem} />
  );
  requestWindow(500, 510);
  const before = Math.min(...slotsOf(nativeProps()).map((child: any) => child.props.index));
  screen.rerender(
    <ListForEach
      data={[{ id: 'new' }, ...data]}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      overscanCount={10}
    />
  );
  expect(slotsOf(nativeProps())).toHaveLength(31);
  expect(Math.min(...slotsOf(nativeProps()).map((child: any) => child.props.index))).toBe(
    before + 1
  );
});

it('keeps pool assignments unique and covers demand across jumps and reversals', () => {
  for (const first of [0, 3, 10, 90, 12, 0, 9999, 4000]) {
    const last = Math.min(first + 8, 9999);
    const { start, capacity } = getWindow(10_000, first, last, 10);
    const slots = getSlotIndices(start, capacity);
    expect(new Set(slots).size).toBe(capacity);
    expect(Math.min(...slots)).toBe(Math.max(0, first - 10));
    expect(Math.max(...slots)).toBe(Math.min(9999, last + 10));
    for (let index = first; index <= last; index++) expect(slots).toContain(index);
    slots.forEach((index, slot) => expect(index % capacity).toBe(slot));
  }
});

it('grows to cover 100 visible rows plus 10 on each side and keeps its capacity when the viewport shrinks', () => {
  render(<ListForEach data={data} keyExtractor={keyExtractor} renderItem={() => <View />} />);
  const indices = () => slotsOf(nativeProps()).map((row: any) => row.props.index);
  const revision = nativeProps().revision;
  requestWindow(500, 599);
  expect(indices()).toHaveLength(120);
  expect([...indices()].sort((a, b) => a - b)).toEqual(
    Array.from({ length: 120 }, (_, index) => index + 490)
  );
  expect(nativeProps().revision).toBe(revision);
  requestWindow(500, 509);
  expect(indices()).toHaveLength(120);
  expect(Math.min(...indices())).toBe(490);
  requestWindow(0, 99);
  expect(indices()).toHaveLength(120);
  expect(Math.min(...indices())).toBe(0);
  requestWindow(9900, 9999);
  expect(indices()).toHaveLength(120);
  expect(Math.max(...indices())).toBe(9999);
});

it('keeps slot assignments stable while rows appear and disappear one at a time', () => {
  render(<ListForEach data={data} keyExtractor={keyExtractor} renderItem={() => <View />} />);
  const assignments = (): number[] => slotsOf(nativeProps()).map((row: any) => row.props.index);
  requestWindow(500, 509);
  requestWindow(500, 510); // A row appears at the bottom before the top row disappears.
  const grown = assignments();
  expect(grown).toHaveLength(41); // Grows once, with overscan headroom, instead of on every row.;
  requestWindow(501, 510); // The top row disappears.
  const shifted = assignments();
  expect(shifted).toHaveLength(41);
  expect(shifted.filter((index, slot) => index !== grown[slot])).toHaveLength(1);
  requestWindow(501, 511); // The next row appears without moving any slot.
  expect(assignments()).toEqual(shifted);
  requestWindow(502, 511);
  expect(assignments().filter((index, slot) => index !== shifted[slot])).toHaveLength(1);
  for (let index = 492; index <= 521; index++) expect(assignments()).toContain(index);
});

it('updates overscan without resetting demand and supports zero extra rows', () => {
  const renderItem = () => <View />;
  const screen = render(
    <ListForEach data={data} keyExtractor={keyExtractor} renderItem={renderItem} />
  );
  requestWindow(500, 599);
  const revision = nativeProps().revision;
  screen.rerender(
    <ListForEach
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      overscanCount={0}
    />
  );
  expect(slotsOf(nativeProps())).toHaveLength(100);
  expect(Math.min(...slotsOf(nativeProps()).map((row: any) => row.props.index))).toBe(500);
  expect(nativeProps().revision).toBe(revision);
  screen.rerender(
    <ListForEach
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      overscanCount={20}
    />
  );
  expect(slotsOf(nativeProps())).toHaveLength(140);
});

it.each([-1, 1.5, NaN, Infinity])('rejects invalid overscan %s', (overscanCount) => {
  expect(() =>
    render(
      <ListForEach
        data={data}
        keyExtractor={keyExtractor}
        renderItem={() => <View />}
        overscanCount={overscanCount}
      />
    )
  ).toThrow('overscanCount must be a non-negative integer');
});

it('keeps the group when only the keyExtractor identity changes', () => {
  const renderItem = jest.fn(() => <View />);
  const screen = render(
    <ListForEach data={data} keyExtractor={(item) => item.id} renderItem={renderItem} />
  );
  requestWindow(500, 510);
  const { revision, itemKeys } = nativeProps();
  const calls = renderItem.mock.calls.length;
  screen.rerender(
    <ListForEach data={data} keyExtractor={(item) => item.id} renderItem={renderItem} />
  );
  expect(nativeProps().revision).toBe(revision);
  expect(nativeProps().itemKeys).toBe(itemKeys);
  expect(renderItem).toHaveBeenCalledTimes(calls);
});

it('keeps ListForEachProps extendable as an interface', () => {
  interface Extended extends ListForEachProps {
    extra: string;
  }
  const props: Extended = { children: null, extra: 'ok' };
  expect(props.extra).toBe('ok');
});

it('forwards full group editing indices and rejects events from old revisions', () => {
  const onDelete = jest.fn();
  const onMove = jest.fn();
  const renderItem = () => <View />;
  const screen = render(
    <ListForEach
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onDelete={onDelete}
      onMove={onMove}
    />
  );
  requestWindow(500, 510);
  const oldProps = nativeProps();
  expect(oldProps.deleteEnabled).toBe(true);
  expect(oldProps.moveEnabled).toBe(true);
  act(() => {
    oldProps.onDelete({
      nativeEvent: { indices: [502, 505], revision: oldProps.revision },
    });
    oldProps.onMove({
      nativeEvent: {
        sourceIndices: [502, 505],
        destination: data.length,
        revision: oldProps.revision,
      },
    });
  });
  expect(onDelete).toHaveBeenCalledWith([502, 505]);
  expect(onMove).toHaveBeenCalledWith([502, 505], data.length);
  screen.rerender(
    <ListForEach
      data={[...data].reverse()}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onDelete={onDelete}
      onMove={onMove}
    />
  );
  act(() => {
    nativeProps().onDelete({
      nativeEvent: { indices: [502], revision: oldProps.revision },
    });
    oldProps.onMove({
      nativeEvent: {
        sourceIndices: [502],
        destination: 0,
        revision: oldProps.revision,
      },
    });
  });
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onMove).toHaveBeenCalledTimes(1);
});

it('maintains independent windows and revisions for separate groups', () => {
  const renderItem = () => <View />;
  render(
    <>
      <ListForEach
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        overscanCount={3}
      />
      <ListForEach
        data={data.slice(0, 20)}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        overscanCount={1}
      />
    </>
  );
  const [first, second] = mockList.mock.calls.map(([props]) => props);
  act(() =>
    first.onWindowChange({
      nativeEvent: { first: 500, last: 502, revision: first.revision },
    })
  );
  expect(slotsOf(nativeProps()).some((row: any) => row.props.index === 500)).toBe(true);
  expect(slotsOf(second).map((row: any) => row.props.index)).toEqual([0, 1]);
  act(() =>
    second.onWindowChange({
      nativeEvent: { first: 15, last: 16, revision: second.revision },
    })
  );
  expect(slotsOf(nativeProps()).some((row: any) => row.props.index === 15)).toBe(true);
  expect(nativeProps().itemKeys).toHaveLength(20);
});

it('disables absent editing actions and preserves children rendering', () => {
  const screen = render(
    <ListForEach>
      <Text>Existing row</Text>
    </ListForEach>
  );
  expect(screen.getByText('Existing row')).toBeTruthy();
  expect(nativeProps().deleteEnabled).toBe(false);
  expect(nativeProps().moveEnabled).toBe(false);
  const onDelete = jest.fn();
  screen.rerender(
    <ListForEach onDelete={onDelete}>
      <Text>Existing row</Text>
    </ListForEach>
  );
  act(() => nativeProps().onDelete({ nativeEvent: { indices: [0] } }));
  expect(onDelete).toHaveBeenCalledWith([0]);
  screen.rerender(
    <ListForEach data={data} keyExtractor={keyExtractor} renderItem={() => <View />} />
  );
  expect(nativeProps().deleteEnabled).toBe(false);
  expect(nativeProps().moveEnabled).toBe(false);
});
