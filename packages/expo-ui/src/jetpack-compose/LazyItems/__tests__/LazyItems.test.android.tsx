import { act, render } from '@testing-library/react-native';
import { createContext, useContext, useState } from 'react';
import { Text, View } from 'react-native';

import { LazyColumn } from '../../LazyColumn';
import { LazyRow } from '../../LazyRow';

const mockItems = jest.fn();
const mockSlot = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: (_module: string, name: string) => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: any) => {
      if (name === 'LazyItemsView') mockItems(props);
      if (name === 'LazyItemsSlotView') mockSlot(props);
      return createElement(View, props);
    };
  },
}));

const data = Array.from({ length: 10_000 }, (_, index) => ({ id: `item-${index}` }));
const keyExtractor = (item: { id: string }) => item.id;
const nativeProps = () => mockItems.mock.calls.at(-1)![0];
const slotsOf = (props: any) => props.children.props.children;
const indicesOf = (props: any = nativeProps()): number[] =>
  slotsOf(props).map((row: any) => row.props.index);
const requestWindow = (first: number, last: number, revision = nativeProps().revision) =>
  act(() => nativeProps().onWindowChange({ nativeEvent: { first, last, revision } }));

beforeEach(() => jest.clearAllMocks());

it('mounts a bounded pool for 10,000 items and recenters after a distant request', async () => {
  const renderItem = jest.fn(({ index }) => <Text>{index}</Text>);
  await render(
    <LazyColumn>
      <LazyColumn.Items data={data} keyExtractor={keyExtractor}>
        {renderItem}
      </LazyColumn.Items>
    </LazyColumn>
  );
  expect(renderItem).toHaveBeenCalledTimes(11);
  expect(nativeProps().itemKeys).toHaveLength(10_000);
  expect(nativeProps().estimatedItemSize).toBe(64);
  await requestWindow(500, 510);
  const indices = indicesOf();
  expect(indices).toHaveLength(31);
  for (let index = 500; index <= 510; index++) expect(indices).toContain(index);
});

it('reuses overlapping slots without rerendering them and preserves parent context', async () => {
  const Context = createContext('missing');
  let mounts = 0;
  function Row({ index }: { index: number }) {
    const [slot] = useState(() => mounts++);
    return <Text>{`${useContext(Context)}:${index}:${slot}`}</Text>;
  }
  const renderItem = jest.fn(({ index }) => <Row index={index} />);
  const screen = await render(
    <Context.Provider value="parent">
      <LazyColumn>
        <LazyColumn.Items data={data} keyExtractor={keyExtractor} overscanCount={3}>
          {renderItem}
        </LazyColumn.Items>
      </LazyColumn>
    </Context.Provider>
  );
  await requestWindow(10, 11);
  expect(mounts).toBe(8);
  const calls = renderItem.mock.calls.length;
  const slot = screen.getAllByText(/^parent:7:/)[0]!.props.children.split(':')[2];
  await requestWindow(12, 13); // Two rows enter, reusing the slots of rows 7 and 8.
  expect(renderItem).toHaveBeenCalledTimes(calls + 2);
  expect(mounts).toBe(8);
  expect(screen.getByText(`parent:15:${slot}`)).toBeTruthy();
});

it('grows once with headroom and keeps slot assignments stable as rows enter and leave', async () => {
  await render(
    <LazyColumn>
      <LazyColumn.Items data={data} keyExtractor={keyExtractor}>
        {() => <View />}
      </LazyColumn.Items>
    </LazyColumn>
  );
  await requestWindow(500, 509);
  await requestWindow(500, 510); // A row appears at the bottom before the top row disappears.
  const grown = indicesOf();
  expect(grown).toHaveLength(41);
  await requestWindow(501, 510); // The top row disappears.
  const shifted = indicesOf();
  expect(shifted).toHaveLength(41);
  expect(shifted.filter((index, slot) => index !== grown[slot])).toHaveLength(1);
  await requestWindow(501, 511); // The next row appears without moving any slot.
  expect(indicesOf()).toEqual(shifted);
  shifted.forEach((index, slot) => expect(index % shifted.length).toBe(slot));
});

it('grows to cover 100 visible rows plus overscan and keeps its capacity at the list edges', async () => {
  await render(
    <LazyColumn>
      <LazyColumn.Items data={data} keyExtractor={keyExtractor}>
        {() => <View />}
      </LazyColumn.Items>
    </LazyColumn>
  );
  const revision = nativeProps().revision;
  await requestWindow(500, 599);
  expect(indicesOf()).toHaveLength(120);
  expect([...indicesOf()].sort((a, b) => a - b)).toEqual(
    Array.from({ length: 120 }, (_, index) => index + 490)
  );
  expect(nativeProps().revision).toBe(revision);
  await requestWindow(500, 509);
  expect(indicesOf()).toHaveLength(120);
  await requestWindow(0, 99);
  expect(Math.min(...indicesOf())).toBe(0);
  await requestWindow(9900, 9999);
  expect(Math.max(...indicesOf())).toBe(9999);
});

it('bumps the revision on a data change, ignores stale requests, and clamps after shrinking', async () => {
  const renderItem = ({ item }: { item: { id: string; title?: string } }) => (
    <Text>{item.title ?? item.id}</Text>
  );
  const screen = await render(
    <LazyColumn>
      <LazyColumn.Items data={data} keyExtractor={keyExtractor}>
        {renderItem}
      </LazyColumn.Items>
    </LazyColumn>
  );
  const revision = nativeProps().revision;
  const updated = [{ id: 'item-0', title: 'Updated' }, ...data.slice(1)];
  await screen.rerender(
    <LazyColumn>
      <LazyColumn.Items data={updated} keyExtractor={keyExtractor}>
        {renderItem}
      </LazyColumn.Items>
    </LazyColumn>
  );
  expect(screen.getByText('Updated')).toBeTruthy();
  expect(nativeProps().revision).not.toBe(revision);
  await requestWindow(9900, 9905);
  expect(indicesOf()).toContain(9900);
  await requestWindow(0, 10, revision); // Sent before the data changed.
  expect(indicesOf()).toContain(9900);
  await screen.rerender(
    <LazyColumn>
      <LazyColumn.Items data={data.slice(0, 3)} keyExtractor={keyExtractor}>
        {renderItem}
      </LazyColumn.Items>
    </LazyColumn>
  );
  expect(indicesOf()).toEqual([0, 1, 2]);
  await screen.rerender(
    <LazyColumn>
      <LazyColumn.Items data={[]} keyExtractor={keyExtractor}>
        {renderItem}
      </LazyColumn.Items>
    </LazyColumn>
  );
  expect(slotsOf(nativeProps())).toHaveLength(0);
  expect(nativeProps().itemKeys).toHaveLength(0);
});

it('drops malformed window events', async () => {
  await render(
    <LazyColumn>
      <LazyColumn.Items data={data} keyExtractor={keyExtractor}>
        {() => <View />}
      </LazyColumn.Items>
    </LazyColumn>
  );
  const before = indicesOf();
  await requestWindow(510, 500);
  await requestWindow(NaN, 10);
  expect(indicesOf()).toEqual(before);
});

it('publishes the item keys and the pooled slot props to the native views', async () => {
  await render(
    <LazyColumn>
      <LazyColumn.Items
        data={data.slice(0, 5)}
        keyExtractor={keyExtractor}
        estimatedItemSize={96}
        overscanCount={1}>
        {() => <View />}
      </LazyColumn.Items>
    </LazyColumn>
  );
  expect(nativeProps().itemKeys).toEqual(['item-0', 'item-1', 'item-2', 'item-3', 'item-4']);
  expect(nativeProps().estimatedItemSize).toBe(96);
  const slots = mockSlot.mock.calls.map(([props]) => props);
  expect(slots.map((props) => props.itemKey)).toEqual(['item-0', 'item-1']);
  expect(slots.map((props) => props.index)).toEqual([0, 1]);
  expect(slots.every((props) => props.revision === nativeProps().revision)).toBe(true);
});

it.each([-1, 1.5, NaN, Infinity])('rejects invalid overscan %s', async (overscanCount) => {
  await expect(
    async () =>
      await render(
        <LazyColumn>
          <LazyColumn.Items data={data} keyExtractor={keyExtractor} overscanCount={overscanCount}>
            {() => <View />}
          </LazyColumn.Items>
        </LazyColumn>
      )
  ).rejects.toThrow('LazyColumn.Items overscanCount must be a non-negative integer');
});

it('names LazyRow.Items in its own errors', async () => {
  await expect(
    async () =>
      await render(
        <LazyRow>
          <LazyRow.Items data={data} keyExtractor={keyExtractor} overscanCount={-1}>
            {() => <View />}
          </LazyRow.Items>
        </LazyRow>
      )
  ).rejects.toThrow('LazyRow.Items overscanCount must be a non-negative integer');
});

it('maintains independent windows for a LazyColumn and a LazyRow block', async () => {
  await render(
    <>
      <LazyColumn>
        <LazyColumn.Items data={data} keyExtractor={keyExtractor} overscanCount={3}>
          {() => <View />}
        </LazyColumn.Items>
      </LazyColumn>
      <LazyRow>
        <LazyRow.Items data={data.slice(0, 20)} keyExtractor={keyExtractor} overscanCount={1}>
          {() => <View />}
        </LazyRow.Items>
      </LazyRow>
    </>
  );
  const [column, row] = mockItems.mock.calls.map(([props]) => props);
  await act(() =>
    column.onWindowChange({ nativeEvent: { first: 500, last: 502, revision: column.revision } })
  );
  expect(indicesOf()).toContain(500);
  expect(indicesOf(row)).toEqual([0, 1]);
  await act(() =>
    row.onWindowChange({ nativeEvent: { first: 15, last: 16, revision: row.revision } })
  );
  expect(nativeProps().itemKeys).toHaveLength(20);
  expect(indicesOf()).toContain(15);
});
