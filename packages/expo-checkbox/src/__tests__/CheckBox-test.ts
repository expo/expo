import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('exports checkbox as default', () => {
    expect(Checkbox).toBeInstanceOf(Object);
  });

  // deprecated -- this test should be removed once this method is removed
  it('exports isAvailableAsync()', () => {
    expect(Checkbox.isAvailableAsync).toBeInstanceOf(Function);
  });
});
