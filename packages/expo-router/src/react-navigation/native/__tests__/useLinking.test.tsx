import { expect, jest, test } from '@jest/globals';
import {
  createNavigationContainerRef,
  type ParamListBase,
} from '../../core';
import { render, type RenderAPI } from '@testing-library/react-native';

import { useLinking } from '../useLinking';

test('throws if multiple instances of useLinking are used', () => {
  const ref = createNavigationContainerRef<ParamListBase>();

  const options = { prefixes: [] };

  function Sample() {
    useLinking(ref, options, () => {});
    useLinking(ref, options, () => {});
    return null;
  }

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  let element: RenderAPI | undefined;

  element = render(<Sample />);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  element?.unmount();

  function A() {
    useLinking(ref, options, () => {});
    return null;
  }

  function B() {
    useLinking(ref, options, () => {});
    return null;
  }

  element = render(
    <>
      <A />
      <B />
    </>
  );

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy.mock.calls[1][0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  element?.unmount();

  function Sample2() {
    useLinking(ref, options, () => {});
    return null;
  }

  const wrapper2 = <Sample2 />;

  render(wrapper2).unmount();

  render(wrapper2);

  expect(spy).toHaveBeenCalledTimes(2);

  element?.unmount();
});
