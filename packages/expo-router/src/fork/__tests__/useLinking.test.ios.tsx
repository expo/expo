import { expect, jest, test } from '@jest/globals';
import { render, type RenderAPI } from '@testing-library/react-native';

import { createNavigationContainerRef, type ParamListBase } from '../../react-navigation/core';
import { useLinking } from '../useLinking';

let errorSpy: jest.SpiedFunction<typeof console.error>;

afterEach(() => {
  errorSpy.mockRestore();
});

test('throws if multiple instances of useLinking are used', () => {
  const ref = createNavigationContainerRef<ParamListBase>();

  const options = { prefixes: [] };

  function Sample() {
    useLinking(ref, options, () => {});
    useLinking(ref, options, () => {});
    return null;
  }

  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  let element: RenderAPI | undefined;

  element = render(<Sample />);

  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0]![0]).toMatch(
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

  expect(errorSpy).toHaveBeenCalledTimes(2);
  expect(errorSpy.mock.calls[1]![0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  element?.unmount();

  function Sample2() {
    useLinking(ref, options, () => {});
    return null;
  }

  const wrapper2 = <Sample2 />;

  render(wrapper2).unmount();

  element = render(wrapper2);

  expect(errorSpy).toHaveBeenCalledTimes(2);

  element?.unmount();
});
