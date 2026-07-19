import * as InterfaceBuilder from '../InterfaceBuilder';

describe('createConstraint', () => {
  it(`creates a reliable constraint`, () => {
    expect(InterfaceBuilder.createConstraint(['item', 'bottom'], ['parent', 'bottom'])).toEqual({
      $: {
        constant: undefined,
        firstAttribute: 'bottom',
        firstItem: 'item',
        id: '0a0b0b7429431f45d0fffda03fe0cb99cfe22f5b',
        secondAttribute: 'bottom',
        secondItem: 'parent',
      },
    });
  });
});
