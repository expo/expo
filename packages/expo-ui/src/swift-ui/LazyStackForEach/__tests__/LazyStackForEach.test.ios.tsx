import { act, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { LazyHStack } from '../../LazyHStack';
import { LazyVStack } from '../../LazyVStack';

const mockForEach = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: (_module: string, name: string) => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: any) => {
      if (name === 'DataListForEachView') mockForEach(props);
      return createElement(View, props);
    };
  },
}));

const data = Array.from({ length: 10_000 }, (_, index) => ({ id: `item-${index}` }));
const keyExtractor = (item: { id: string }) => item.id;
const indicesOf = (props: any): number[] =>
  props.children.props.children.map((row: any) => row.props.index);

beforeEach(() => jest.clearAllMocks());

it('passes the axis of each stack to the native view', () => {
  render(
    <>
      <LazyVStack>
        <LazyVStack.ForEach data={data} keyExtractor={keyExtractor}>
          {() => <View />}
        </LazyVStack.ForEach>
      </LazyVStack>
      <LazyHStack>
        <LazyHStack.ForEach data={data} keyExtractor={keyExtractor} estimatedItemSize={72}>
          {() => <View />}
        </LazyHStack.ForEach>
      </LazyHStack>
    </>
  );
  const [vertical, horizontal] = mockForEach.mock.calls.map(([props]) => props);
  expect(vertical.axis).toBe('vertical');
  expect(vertical.estimatedItemSize).toBe(64);
  expect(horizontal.axis).toBe('horizontal');
  expect(horizontal.estimatedItemSize).toBe(72);
});

it.each([
  ['LazyVStack.ForEach', LazyVStack],
  ['LazyHStack.ForEach', LazyHStack],
] as const)('names %s in its own errors', (name, Stack) => {
  expect(() =>
    render(
      <Stack>
        <Stack.ForEach data={data} keyExtractor={keyExtractor} overscanCount={-1}>
          {() => <View />}
        </Stack.ForEach>
      </Stack>
    )
  ).toThrow(`${name} overscanCount must be a non-negative integer`);
});

it('maintains independent windows for a LazyVStack and a LazyHStack block', () => {
  render(
    <>
      <LazyVStack>
        <LazyVStack.ForEach data={data} keyExtractor={keyExtractor} overscanCount={3}>
          {() => <View />}
        </LazyVStack.ForEach>
      </LazyVStack>
      <LazyHStack>
        <LazyHStack.ForEach data={data.slice(0, 20)} keyExtractor={keyExtractor} overscanCount={1}>
          {() => <View />}
        </LazyHStack.ForEach>
      </LazyHStack>
    </>
  );
  const [vertical, horizontal] = mockForEach.mock.calls.map(([props]) => props);
  act(() =>
    vertical.onWindowChange({ nativeEvent: { first: 500, last: 502, revision: vertical.revision } })
  );
  const latest = () => mockForEach.mock.calls.at(-1)![0];
  expect(latest().axis).toBe('vertical');
  expect(indicesOf(latest())).toContain(500);
  expect(indicesOf(horizontal)).toEqual([0, 1]);
  act(() =>
    horizontal.onWindowChange({
      nativeEvent: { first: 15, last: 16, revision: horizontal.revision },
    })
  );
  expect(latest().axis).toBe('horizontal');
  expect(indicesOf(latest())).toContain(15);
});

it('renders every row as a plain stack child when recycling is disabled', () => {
  const renderItem = jest.fn(({ index }: { index: number }) => <Text>{`row-${index}`}</Text>);
  const screen = render(
    <LazyVStack>
      <LazyVStack.ForEach data={data.slice(0, 50)} keyExtractor={keyExtractor} recycling={false}>
        {renderItem}
      </LazyVStack.ForEach>
    </LazyVStack>
  );
  expect(mockForEach).not.toHaveBeenCalled();
  expect(renderItem).toHaveBeenCalledTimes(50);
  expect(screen.getByText('row-49')).toBeTruthy();
});
