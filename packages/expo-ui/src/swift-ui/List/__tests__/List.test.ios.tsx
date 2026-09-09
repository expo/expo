import { act, fireEvent, render } from '@testing-library/react-native';
import { createContext, useContext, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { List } from '..';

jest.mock('expo', () => ({
  requireNativeView: () => require('react-native').View,
}));

let revision = 0;
let activeKeys = new Set<string>();
beforeEach(() => {
  revision = 0;
  activeKeys = new Set();
});
function demand(key: string) {
  activeKeys.add(key);
  return { nativeEvent: { key, keys: [...activeKeys], revision: ++revision } };
}

const data = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const keyExtractor = (item: { id: string }) => item.id;

it('sends all keys to native but renders only requested content', () => {
  const renderItem = jest.fn(({ item }) => <Text>{item.id}</Text>);
  const screen = render(
    <List
      testID="list"
      initialNumToRender={0}
      overscanCount={0}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
  expect(screen.getByTestId('list').props.rowKeys).toEqual(['a', 'b', 'c']);
  expect(renderItem).not.toHaveBeenCalled();

  fireEvent(screen.getByTestId('list'), 'requestItem', demand('b'));
  expect(screen.getByText('b')).toBeTruthy();
  expect(screen.queryByText('a')).toBeNull();
  expect(renderItem).toHaveBeenCalledTimes(1);

  // Multiple requests before React commits must accumulate rather than overwrite each other.
  act(() => {
    fireEvent(screen.getByTestId('list'), 'requestItem', demand('a'));
    fireEvent(screen.getByTestId('list'), 'requestItem', demand('c'));
  });
  expect(screen.getByText('a')).toBeTruthy();
  expect(screen.getByText('b')).toBeTruthy();
  expect(screen.getByText('c')).toBeTruthy();
});

it('keeps ordinary React context and row state across repeat requests and data updates', () => {
  const LabelContext = createContext('missing');
  function Row({ id }: { id: string }) {
    const label = useContext(LabelContext);
    const [count, setCount] = useState(0);
    return (
      <Pressable testID={`row-${id}`} onPress={() => setCount((value) => value + 1)}>
        <Text>{`${label} ${id}: ${count}`}</Text>
      </Pressable>
    );
  }
  const example = (label: string) => (
    <LabelContext.Provider value={label}>
      <List
        testID="list"
        initialNumToRender={0}
        overscanCount={0}
        data={[...data]}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <Row id={item.id} />}
      />
    </LabelContext.Provider>
  );
  const screen = render(example('Hello'));
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('a'));
  fireEvent.press(screen.getByTestId('row-a'));
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('a'));
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('unknown'));
  expect(screen.getByText('Hello a: 1')).toBeTruthy();
  screen.rerender(example('Updated'));
  expect(screen.getByText('Updated a: 1')).toBeTruthy();
});

it('preserves surviving row state through inserts, reorders, and deletes without remounting the list', () => {
  function Row({ id, index }: { id: string; index: number }) {
    const [count, setCount] = useState(0);
    return (
      <Pressable testID={`row-${id}`} onPress={() => setCount((value) => value + 1)}>
        <Text>{`${id}: ${count} at ${index}`}</Text>
      </Pressable>
    );
  }
  const renderItem = ({ item, index }: { item: { id: string }; index: number }) => (
    <Row id={item.id} index={index} />
  );
  const example = (items: typeof data) => (
    <List
      testID="list"
      initialNumToRender={0}
      overscanCount={0}
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
  const screen = render(example(data));
  const nativeList = screen.getByTestId('list');
  const oldRequest = screen.getByTestId('list').props.onRequestItem;
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('a'));
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('b'));
  fireEvent.press(screen.getByTestId('row-a'));
  fireEvent.press(screen.getByTestId('row-b'));

  screen.rerender(example([{ id: 'new' }, ...data]));
  expect(screen.getByText('a: 1 at 1')).toBeTruthy();
  expect(screen.queryByTestId('row-new')).toBeNull();
  screen.rerender(example([data[1]!, data[0]!]));
  expect(screen.getByTestId('list')).toBe(nativeList);
  expect(nativeList.props.rowKeys).toEqual(['b', 'a']);
  expect(screen.getByText('b: 1 at 0')).toBeTruthy();
  expect(screen.getByText('a: 1 at 1')).toBeTruthy();

  screen.rerender(example([data[1]!]));
  act(() => oldRequest(demand('a')));
  expect(screen.queryByTestId('row-a')).toBeNull();
  expect(screen.getByText('b: 1 at 0')).toBeTruthy();
  screen.rerender(example(data));
  expect(screen.queryByTestId('row-a')).toBeNull();
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('a'));
  expect(screen.getByText('a: 0 at 0')).toBeTruthy();
  expect(screen.getByText('b: 1 at 1')).toBeTruthy();
});

it('does not read the dataset or rerender unchanged rows when more keys are requested', () => {
  let itemReads = 0;
  const items = new Proxy(
    Array.from({ length: 10000 }, (_, index) => ({ id: String(index) })),
    {
      get(target, property, receiver) {
        if (typeof property === 'string' && /^\d+$/.test(property)) itemReads++;
        return Reflect.get(target, property, receiver);
      },
    }
  );
  const extractKey = jest.fn(keyExtractor);
  const renderItem = jest.fn(({ item }) => <Text>{item.id}</Text>);
  const example = () => (
    <List
      testID="list"
      initialNumToRender={0}
      overscanCount={0}
      data={items}
      keyExtractor={extractKey}
      renderItem={renderItem}
    />
  );
  const screen = render(example());
  const nativeKeys = screen.getByTestId('list').props.rowKeys;
  expect(extractKey).toHaveBeenCalledTimes(10000);
  expect(renderItem).not.toHaveBeenCalled();
  itemReads = 0;
  extractKey.mockClear();

  fireEvent(screen.getByTestId('list'), 'requestItem', demand('9999'));
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('2'));
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('2'));
  screen.rerender(example());
  expect(itemReads).toBe(0);
  expect(extractKey).not.toHaveBeenCalled();
  expect(screen.getByTestId('list').props.rowKeys).toBe(nativeKeys);
  expect(renderItem).toHaveBeenCalledTimes(2);
  expect(renderItem).toHaveBeenNthCalledWith(1, { item: { id: '9999' }, index: 9999 });
  expect(renderItem).toHaveBeenNthCalledWith(2, { item: { id: '2' }, index: 2 });
});

it('updates mounted content and render callbacks without resetting row identity', () => {
  const items = [{ id: 'a', title: 'Before' }];
  const renderItem = jest.fn(({ item }) => <Text>{item.title}</Text>);
  const screen = render(
    <List
      testID="list"
      initialNumToRender={0}
      overscanCount={0}
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
  fireEvent(screen.getByTestId('list'), 'requestItem', demand('a'));
  const updated = [{ id: 'a', title: 'After' }];
  screen.rerender(
    <List
      testID="list"
      initialNumToRender={0}
      overscanCount={0}
      data={updated}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
  expect(screen.getByText('After')).toBeTruthy();
  screen.rerender(
    <List
      testID="list"
      initialNumToRender={0}
      overscanCount={0}
      data={updated}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => <Text>{`New renderer: ${item.title}`}</Text>}
    />
  );
  expect(screen.getByText('New renderer: After')).toBeTruthy();
});

it('preserves the existing children and selection event API', () => {
  const onSelectionChange = jest.fn();
  const screen = render(
    <List testID="list" selection={['a']} onSelectionChange={onSelectionChange}>
      <List.ForEach>
        <Text>Existing row</Text>
      </List.ForEach>
    </List>
  );
  expect(screen.getByText('Existing row')).toBeTruthy();
  expect(screen.getByTestId('list').props.rowKeys).toBeUndefined();
  fireEvent(screen.getByTestId('list'), 'selectionChange', { nativeEvent: { selection: ['b'] } });
  expect(onSelectionChange).toHaveBeenCalledWith(['b']);
});

it('rejects duplicate keys and invalid estimated heights', () => {
  expect(() =>
    render(
      <List
        initialNumToRender={0}
        overscanCount={0}
        data={data}
        keyExtractor={() => 'duplicate'}
        renderItem={() => null}
      />
    )
  ).toThrow('unique string');
  expect(() =>
    render(
      <List
        initialNumToRender={0}
        overscanCount={0}
        data={data}
        keyExtractor={keyExtractor}
        estimatedRowHeight={0}
        renderItem={() => null}
      />
    )
  ).toThrow('finite positive number');
});
