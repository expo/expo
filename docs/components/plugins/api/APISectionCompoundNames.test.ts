import { GeneratedData, PropData, TypeDefinitionData, TypeDocKind } from './APIDataTypes';
import { buildCompoundNameByComponent, deriveComponentsFromProps } from './APISectionCompoundNames';

const makeComponentType = (propsName: string): TypeDefinitionData => ({
  type: 'reference',
  name: 'React.FC',
  typeArguments: [{ type: 'reference', name: propsName }],
});

const makeProp = (name: string, type?: TypeDefinitionData, defaultValue?: string): PropData =>
  ({
    name,
    kind: TypeDocKind.Property,
    type,
    defaultValue,
  }) as PropData;

const makeComponent = (name: string, propsName: string, children: PropData[] = []): GeneratedData =>
  ({
    name,
    kind: TypeDocKind.Class,
    type: makeComponentType(propsName),
    children,
  }) as GeneratedData;

describe('buildCompoundNameByComponent', () => {
  test('maps direct component properties to compound names', () => {
    const menuItem = makeComponent('MenuItem', 'MenuItemProps');
    const menu = makeComponent('Menu', 'MenuProps', [
      makeProp('Item', makeComponentType('MenuItemProps')),
    ]);

    const result = Object.fromEntries(buildCompoundNameByComponent([menu, menuItem]));

    expect(result).toEqual({
      MenuItem: 'Menu.Item',
    });
  });

  test('chains compound names when parent is itself a compound component', () => {
    const menuItemIcon = makeComponent('MenuItemIcon', 'MenuItemIconProps');
    const menuItem = makeComponent('MenuItem', 'MenuItemProps', [
      makeProp('Icon', makeComponentType('MenuItemIconProps')),
    ]);
    const menu = makeComponent('Menu', 'MenuProps', [
      makeProp('Item', makeComponentType('MenuItemProps')),
    ]);

    const result = Object.fromEntries(buildCompoundNameByComponent([menu, menuItem, menuItemIcon]));

    expect(result).toEqual({
      MenuItem: 'Menu.Item',
      MenuItemIcon: 'Menu.Item.Icon',
    });
  });

  test('uses string default values as component targets', () => {
    const tabs = makeComponent('Tabs', 'TabsProps', [makeProp('Tab', undefined, 'Tab')]);

    const result = Object.fromEntries(buildCompoundNameByComponent([tabs]));

    expect(result).toEqual({
      Tab: 'Tabs.Tab',
    });
  });
});

describe('deriveComponentsFromProps', () => {
  test('derives components from prop types when not exported', () => {
    const menu = makeComponent('Menu', 'MenuProps', [
      makeProp('Item', makeComponentType('MenuItemProps')),
    ]);

    const result = deriveComponentsFromProps([menu]).map(entry => entry.name);

    expect(result).toEqual(['Menu', 'MenuItem']);
  });

  test('derives nested components from compound component properties', () => {
    const menuItem = makeComponent('MenuItem', 'MenuItemProps', [
      makeProp('Icon', makeComponentType('MenuItemIconProps')),
    ]);
    const menu = makeComponent('Menu', 'MenuProps', [
      makeProp('Item', makeComponentType('MenuItemProps')),
    ]);

    const result = deriveComponentsFromProps([menu, menuItem]).map(entry => entry.name);

    expect(result).toEqual(['Menu', 'MenuItem', 'MenuItemIcon']);
  });

  test('derives components from string default values', () => {
    const tabs = makeComponent('Tabs', 'TabsProps', [makeProp('Tab', undefined, 'Tab')]);

    const result = deriveComponentsFromProps([tabs]).map(entry => entry.name);

    expect(result).toEqual(['Tabs', 'Tab']);
  });
});
