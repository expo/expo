import { act, render } from '@testing-library/react-native';

import { ListForEach } from '../ListForEach';

let mockListProps: any;

jest.mock('expo', () => ({
  requireNativeView: jest.fn((_module, name) => {
    const { View } = require('react-native');
    const { createElement } = require('react');
    return (props: any) => {
      if (name === 'ListForEachView') mockListProps = props;
      return createElement(View, {
        ...props,
        testID: name === 'ListItemView' ? `row-${props.rowKey}` : 'list',
      });
    };
  }),
}));

const data = Array.from({ length: 100 }, (_, index) => String(index));
const keyExtractor = (item: string) => item;
const renderItem = () => null;

function example(overscanCount?: number) {
  return (
    <ListForEach data={data} keyExtractor={keyExtractor} overscanCount={overscanCount}>
      {renderItem}
    </ListForEach>
  );
}

function reportWindow(keys: string[], revision: number) {
  act(() => {
    mockListProps.onRenderWindowChange({
      nativeEvent: { keys, revision, dataVersion: mockListProps.dataVersion },
    });
  });
}

it('defaults to ten neighbors on each side, plus the initial ten rows', () => {
  const screen = render(example());
  reportWindow(['50'], 1);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(31);
  expect(screen.getByTestId('row-40')).toBeTruthy();
  expect(screen.getByTestId('row-60')).toBeTruthy();
  expect(screen.queryByTestId('row-61')).toBeNull();
});

it('can grow and shrink overscan without changing the native dataset version', () => {
  const screen = render(example(2));
  reportWindow(['50'], 1);
  const version = mockListProps.dataVersion;
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(15);
  screen.rerender(example(25));
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(61);
  expect(mockListProps.dataVersion).toBe(version);
  screen.rerender(example(0));
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(11);
  reportWindow(['60'], 2);
  expect(screen.queryByTestId('row-50')).toBeNull();
  expect(screen.queryByTestId('row-59')).toBeNull();
  expect(screen.getByTestId('row-60')).toBeTruthy();
});

it('clamps at dataset boundaries and deduplicates overlapping neighbors', () => {
  const screen = render(example(5));
  reportWindow(['98', '99', 'deleted'], 1);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(17);
  expect(screen.getByTestId('row-93')).toBeTruthy();
  expect(screen.getByTestId('row-99')).toBeTruthy();
});

it('does not mount missing overscan rows in an urgent request', () => {
  const screen = render(example(25));
  act(() => {
    mockListProps.onRequestItem({
      nativeEvent: { key: '50', keys: ['50'], revision: 1, dataVersion: 0 },
    });
  });
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(11);
  expect(screen.queryByTestId('row-49')).toBeNull();
  reportWindow(['50'], 2);
  expect(screen.getAllByTestId(/^row-/)).toHaveLength(61);
  expect(screen.getByTestId('row-49')).toBeTruthy();
});
