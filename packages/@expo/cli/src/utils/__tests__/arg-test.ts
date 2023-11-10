import * as Log from '../../log';
import { assertWithOptionsArgs } from '../args';

jest.mock('../../log');

describe(assertWithOptionsArgs, () => {
  it('handles unknown options errors', () => {
    jest.mocked(Log.exit).mockImplementation();
    expect(() => assertWithOptionsArgs({ '--help': Boolean }, { argv: ['--unknown'] })).toThrow();
    expect(Log.exit).toHaveBeenCalledWith('Unknown or unexpected option: --unknown', 1);
  });

  it('handles missing arguments errors', () => {
    jest.mocked(Log.exit).mockImplementation();
    expect(() => assertWithOptionsArgs({ '--name': String }, { argv: ['--name'] })).toThrow('kln');
    expect(Log.exit).toHaveBeenCalledWith('Option requires argument: --name', 1);
  });
});
