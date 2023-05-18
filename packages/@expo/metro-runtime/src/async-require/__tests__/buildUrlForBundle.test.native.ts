import getDevServer from '../../getDevServer';
import { buildUrlForBundle } from '../buildUrlForBundle';

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../getDevServer', () => {
  return jest.fn();
});

it(`returns an expected URL`, () => {
  asMock(getDevServer).mockReturnValueOnce({
    bundleLoadedFromServer: true,
    fullBundleUrl:
      'http://localhost:19000?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null',
    url: 'http://localhost:19000',
  });

  expect(buildUrlForBundle('/foobar', {})).toEqual(
    'http://localhost:19000/foobar.bundle?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null'
  );
});

it(`returns an expected URL with extra parameters`, () => {
  asMock(getDevServer).mockReturnValueOnce({
    bundleLoadedFromServer: true,
    fullBundleUrl: 'http://localhost:19000?platform=android',
    url: 'http://localhost:19000',
  });

  expect(buildUrlForBundle('/more/than/one', { happy: 'meal' })).toEqual(
    'http://localhost:19000/more/than/one.bundle?platform=android&happy=meal'
  );
});

it('throws on native when the bundle is not hosted', () => {
  asMock(getDevServer).mockReturnValueOnce({
    bundleLoadedFromServer: false,
    fullBundleUrl: 'file://',
    url: 'file://',
  });

  expect(() => buildUrlForBundle('foobar', {})).toThrowErrorMatchingInlineSnapshot(
    `"This bundle was compiled with 'transformer.experimentalImportBundleSupport' in the 'metro.config.js' and can only be used when connected to a Metro server."`
  );
});
