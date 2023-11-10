import * as Log from '../../log';
import { assertWithOptionsArgs } from '../args';

jest.mock('../../log');

describe(assertWithOptionsArgs, () => {
  it('handles unknown options errors', () => {
    jest.mocked(Log.exit).mockImplementation();
    expect(() => assertWithOptionsArgs({ '--help': Boolean }, { argv: ['--unknown'] })).toThrow();
    expect(Log.exit).toHaveBeenCalledWith('unknown or unexpected option: --unknown', 1);
  });

  it('handles missing arguments errors', () => {
    jest.mocked(Log.exit).mockImplementation();
    expect(() => assertWithOptionsArgs({ '--name': String }, { argv: ['--name'] })).toThrow();
    expect(Log.exit).toHaveBeenCalledWith('option requires argument: --name', 1);
  });
});
