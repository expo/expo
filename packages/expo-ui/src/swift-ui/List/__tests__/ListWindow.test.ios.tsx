import { act, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { List } from '..';

jest.mock('expo', () => ({ requireNativeView: () => require('react-native').View }));

const data = Array.from({ length: 100 }, (_, index) => ({ id: String(index) }));
const keyExtractor = (item: { id: string }) => item.id;
function Row({ id }: { id: string }) {
  const [count, setCount] = useState(0);
  return (
    <Pressable testID={`row-${id}`} onPress={() => setCount((value) => value + 1)}>
      <Text>{`${id}: ${count}`}</Text>
    </Pressable>
  );
}
const renderItem = ({ item }: { item: { id: string } }) => <Row id={item.id} />;
const props = { data, keyExtractor, renderItem, testID: 'list', initialNumToRender: 0 };

it('retains nearby rows but unmounts distant content and resets evicted local state', () => {
  const screen = render(<List {...props} overscanCount={2} />);
  const window = (keys: string[], revision: number) =>
    fireEvent(screen.getByTestId('list'), 'renderWindowChange', {
      nativeEvent: { keys, revision },
    });
  window(['10', '11'], 1);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(6); // 8 through 13
  fireEvent.press(screen.getByTestId('row-10'));
  window(['12'], 2);
  expect(screen.getByText('10: 1')).toBeTruthy(); // Still in the buffer.
  window(['30'], 3);
  expect(screen.queryByTestId('row-10')).toBeNull();
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(5);
  window(['10'], 4);
  expect(screen.getByText('10: 0')).toBeTruthy();
  window([], 5);
  expect(screen.queryAllByTestId(/^row-/)).toHaveLength(0);
});

it('renders and pins the initial batch while evicting other rows', () => {
  const screen = render(<List {...props} initialNumToRender={2} overscanCount={0} />);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(2);
  fireEvent.press(screen.getByTestId('row-0'));
  fireEvent(screen.getByTestId('list'), 'renderWindowChange', {
    nativeEvent: { keys: ['50'], revision: 1 },
  });
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(3);
  expect(screen.getByText('0: 1')).toBeTruthy();
  fireEvent(screen.getByTestId('list'), 'renderWindowChange', {
    nativeEvent: { keys: [], revision: 2 },
  });
  expect(screen.queryByTestId('row-50')).toBeNull();
  expect(screen.getByText('0: 1')).toBeTruthy();
});

it('does not let an older transition evict a newer urgent request, even for an already mounted row', () => {
  const screen = render(<List {...props} overscanCount={0} />, { concurrentRoot: true });
  const list = screen.getByTestId('list');
  fireEvent(list, 'requestItem', { nativeEvent: { key: '10', keys: ['10'], revision: 1 } });
  act(() => {
    fireEvent(list, 'renderWindowChange', { nativeEvent: { keys: ['20'], revision: 2 } });
    fireEvent(list, 'requestItem', { nativeEvent: { key: '10', keys: ['10'], revision: 3 } });
  });
  expect(screen.getByTestId('row-10')).toBeTruthy();
  fireEvent(list, 'renderWindowChange', { nativeEvent: { keys: [], revision: 2 } });
  expect(screen.getByTestId('row-10')).toBeTruthy();
  fireEvent(list, 'renderWindowChange', { nativeEvent: { keys: ['20'], revision: 4 } });
  expect(screen.queryByTestId('row-10')).toBeNull();
  expect(screen.getByTestId('row-20')).toBeTruthy();
});

it('bounds disjoint windows without scanning the dataset or filling the gap', () => {
  let reads = 0;
  const items = new Proxy(
    Array.from({ length: 10000 }, (_, index) => ({ id: String(index) })),
    {
      get(target, property, receiver) {
        if (typeof property === 'string' && /^\d+$/.test(property)) reads++;
        return Reflect.get(target, property, receiver);
      },
    }
  );
  const screen = render(<List {...props} data={items} overscanCount={2} />);
  reads = 0;
  fireEvent(screen.getByTestId('list'), 'renderWindowChange', {
    nativeEvent: { keys: ['0', '9999'], revision: 1 },
  });
  expect(reads).toBe(0);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(6);
  expect(screen.queryByTestId('row-5000')).toBeNull();
});

it('applies buffer changes to the current window without resetting surviving state', () => {
  const screen = render(<List {...props} overscanCount={2} />);
  fireEvent(screen.getByTestId('list'), 'renderWindowChange', {
    nativeEvent: { keys: ['10'], revision: 1 },
  });
  fireEvent.press(screen.getByTestId('row-10'));
  screen.rerender(<List {...props} overscanCount={0} />);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(1);
  expect(screen.getByText('10: 1')).toBeTruthy();
});

it('uses extraData to invalidate memoized rows without rebuilding keys', () => {
  let title = 'Before';
  const renderExternal = jest.fn(() => <Text>{title}</Text>);
  const screen = render(
    <List {...props} initialNumToRender={1} renderItem={renderExternal} extraData={0} />
  );
  const keys = screen.getByTestId('list').props.rowKeys;
  title = 'After';
  screen.rerender(
    <List {...props} initialNumToRender={1} renderItem={renderExternal} extraData={1} />
  );
  expect(screen.getByText('After')).toBeTruthy();
  expect(renderExternal).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('list').props.rowKeys).toBe(keys);
});

it('defaults to ten initial rows and validates window sizes', () => {
  const screen = render(<List data={data} keyExtractor={keyExtractor} renderItem={renderItem} />);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(10);
  expect(() => render(<List {...props} overscanCount={-1} />)).toThrow(
    'non-negative safe integers'
  );
  expect(() => render(<List {...props} initialNumToRender={1.5} />)).toThrow(
    'non-negative safe integers'
  );
});

it('bounds mounted content even when no background window update commits during a fling', () => {
  const screen = render(<List {...props} overscanCount={2} />);
  for (let index = 0; index < 100; index++) {
    const key = String(index);
    fireEvent(screen.getByTestId('list'), 'requestItem', {
      nativeEvent: { key, keys: [key], revision: index + 1 },
    });
    // Already-mounted neighbors are retained; not-yet-mounted neighbors are not rendered urgently.
    expect(screen.getAllByTestId(/^row-/).length).toBeLessThanOrEqual(3);
  }
  expect(screen.queryByTestId('row-0')).toBeNull();
  expect(screen.getByTestId('row-99')).toBeTruthy();
});
