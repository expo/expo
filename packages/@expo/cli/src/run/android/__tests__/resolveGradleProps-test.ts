import { CommandError } from '../../../utils/errors';
import { resolveGradleProps } from '../resolveGradleProps';

describe(resolveGradleProps, () => {
  it(`asserts variant`, () => {
    expect(() =>
      resolveGradleProps('/', {
        // @ts-expect-error
        variant: 123,
      })
    ).toThrow(CommandError);
  });
  it(`parses flavors`, () => {
    expect(resolveGradleProps('/', { variant: 'firstSecondThird' })).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/second/third/first',
      appName: 'app',
      buildType: 'first',
      flavors: ['second', 'third'],
    });
  });

  it(`parses with no variant`, () => {
    expect(resolveGradleProps('/', {})).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildType: 'debug',
      flavors: [],
    });
  });
});
