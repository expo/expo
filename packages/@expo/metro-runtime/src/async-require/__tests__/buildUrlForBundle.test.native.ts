import getDevServer from '../../getDevServer';
import { buildUrlForBundle } from '../buildUrlForBundle';

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../getDevServer', () => ({
  __esModule: true,
  default: jest.fn(),
}));

it(`returns an expected URL`, () => {
  asMock(getDevServer).mockReturnValueOnce({
    bundleLoadedFromServer: true,
    fullBundleUrl:
      'http://localhost:19000?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null',
    url: 'http://localhost:19000',
  });

  expect(buildUrlForBundle('/foobar')).toEqual('http://localhost:19000/foobar');
});
