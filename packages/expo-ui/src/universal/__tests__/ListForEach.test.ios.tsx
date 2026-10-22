import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { List } from '../List';

const mockItems = jest.fn();

jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  requireNativeView: (_module: string, name: string) => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: any) => {
      if (name === 'DataListForEachView') mockItems(props);
      return createElement(View, props);
    };
  },
}));

const data = Array.from({ length: 10_000 }, (_, index) => ({ id: `item-${index}` }));
const keyExtractor = (item: { id: string }) => item.id;

it('recycles rows through SwiftUI List.ForEach', async () => {
  const renderItem = jest.fn(({ index }) => <Text>{index}</Text>);
  await render(
    <List>
      <List.ForEach data={data} keyExtractor={keyExtractor} estimatedItemSize={44}>
        {renderItem}
      </List.ForEach>
    </List>
  );
  expect(renderItem).toHaveBeenCalledTimes(11);
  expect(mockItems.mock.calls.at(-1)![0].itemKeys).toHaveLength(10_000);
  expect(mockItems.mock.calls.at(-1)![0].estimatedItemSize).toBe(44);
});

it('names List.ForEach in errors', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(
    render(
      <List>
        <List.ForEach data={[{ id: 'a' }, { id: 'a' }]} keyExtractor={keyExtractor}>
          {({ item }) => <Text>{item.id}</Text>}
        </List.ForEach>
      </List>
    )
  ).rejects.toThrow('List.ForEach keyExtractor must return a unique string for every item.');
});
