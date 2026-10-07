import type { ResolvedOptions } from '../../resolveOptions';
import { compileIosAsync } from '../compileIosAsync';
import { resolveOptions } from '../resolveOptions';

jest.mock('../../../log');
jest.mock('../resolveOptions');

const options: ResolvedOptions = { mode: 'development', outputType: 'app' };

describe(compileIosAsync, () => {
  it(`resolves the iOS build props`, async () => {
    await expect(compileIosAsync('/app', options)).rejects.toThrow(/EXIT_CALLED/);
    expect(resolveOptions).toHaveBeenCalledWith('/app', options);
  });
});
