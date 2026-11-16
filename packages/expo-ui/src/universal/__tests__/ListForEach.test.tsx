import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { List } from '../List';

jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  requireNativeView: () => {
    const { View } = require('react-native');
    return View;
  },
}));

const keyExtractor = (item: { id: string }) => item.id;
const data = Array.from({ length: 10_000 }, (_, index) => ({ id: `item-${index}` }));

it('mounts a bounded pool of rows', async () => {
  const renderItem = jest.fn(({ item }) => <View testID={item.id} />);
  await render(
    <List>
      <List.ForEach data={data} keyExtractor={keyExtractor}>
        {renderItem}
      </List.ForEach>
    </List>
  );
  expect(renderItem).toHaveBeenCalledTimes(11);
});

it('renders every row when recycling is false', async () => {
  const renderItem = jest.fn(({ item }) => <View testID={item.id} />);
  await render(
    <List>
      <List.ForEach data={data.slice(0, 50)} keyExtractor={keyExtractor} recycling={false}>
        {renderItem}
      </List.ForEach>
    </List>
  );
  expect(renderItem).toHaveBeenCalledTimes(50);
});

it('names List.ForEach in errors', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(
    render(
      <List>
        <List.ForEach data={[{ id: 'a' }, { id: 'a' }]} keyExtractor={keyExtractor}>
          {({ item }) => <View testID={item.id} />}
        </List.ForEach>
      </List>
    )
  ).rejects.toThrow('List.ForEach keyExtractor must return a unique string for every item.');
});
