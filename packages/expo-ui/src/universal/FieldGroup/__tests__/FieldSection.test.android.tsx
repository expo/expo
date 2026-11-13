import { render } from '@testing-library/react-native';

import { FieldGroup } from '..';
import { renderedNativeViews } from '../../../__mocks__/expo';
import { ListItem } from '../../ListItem';
import { Switch } from '../../Switch';

jest.mock('expo');

function renderedListItems() {
  return renderedNativeViews.mock.calls
    .filter(([name]) => name === 'ListItemView')
    .map(([, props]) => props);
}

function modifierTypes(props: Record<string, any>) {
  return (props.modifiers ?? []).map((modifier: { $type: string }) => modifier.$type);
}

describe('FieldGroup.Section on Android', () => {
  it('renders a ListItem row as a single Compose ListItem', async () => {
    const onPress = jest.fn();
    await render(
      <FieldGroup.Section>
        <ListItem onPress={onPress}>Row A</ListItem>
        <ListItem>Row B</ListItem>
      </FieldGroup.Section>
    );

    const listItems = renderedListItems();
    expect(listItems).toHaveLength(2);
    // The row's shape is clipped before the click handler, so the ripple follows the rounded row.
    expect(modifierTypes(listItems[0])).toEqual(['fillMaxWidth', 'clip', 'clickable']);
    expect(modifierTypes(listItems[1])).toEqual(['fillMaxWidth', 'clip']);
  });

  it('keeps the modifiers and colors set on the ListItem', async () => {
    await render(
      <FieldGroup.Section>
        <ListItem
          colors={{ contentColor: '#ff0000' }}
          modifiers={[{ $type: 'testTag', tag: 'row' } as any]}>
          Row
        </ListItem>
      </FieldGroup.Section>
    );

    const [listItem] = renderedListItems();
    expect(modifierTypes(listItem)).toEqual(['fillMaxWidth', 'clip', 'testTag']);
    expect(listItem.colors).toEqual(expect.objectContaining({ contentColor: '#ff0000' }));
  });

  it('still wraps other rows in a Compose ListItem', async () => {
    await render(
      <FieldGroup.Section>
        <Switch label="Toggle" value={false} onValueChange={() => {}} />
      </FieldGroup.Section>
    );

    expect(renderedListItems()).toHaveLength(1);
  });
});
