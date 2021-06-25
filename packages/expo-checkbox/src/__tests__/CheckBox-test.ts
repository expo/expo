import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('has static method isAvailableAsync', () => {
    expect(Checkbox.isAvailableAsync).toBeInstanceOf(Function);
  });

  it('exports checkbox as default', () => {
    expect(Checkbox).toBeInstanceOf(Object);
  });
});
