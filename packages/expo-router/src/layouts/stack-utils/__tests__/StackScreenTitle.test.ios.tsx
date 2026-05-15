import { Stack } from '../../Stack';
import { StackTitle, appendStackTitlePropsToOptions } from '../StackTitle';
import { StackScreenTitle, appendStackScreenTitlePropsToOptions } from '../screen/StackScreenTitle';

describe('Stack.Screen.Title (deprecated alias)', () => {
  it('exposes the same component as Stack.Title', () => {
    expect(StackScreenTitle).toBe(StackTitle);
    expect(Stack.Screen.Title).toBe(Stack.Title);
    expect(Stack.Screen.Title).toBe(StackTitle);
  });

  it('exposes the same options helper as appendStackTitlePropsToOptions', () => {
    expect(appendStackScreenTitlePropsToOptions).toBe(appendStackTitlePropsToOptions);
  });
});
