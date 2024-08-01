import { NormalizedOptions } from '../../Fingerprint.types';
import { profile } from '../Profile';

it(`respects input types`, () => {
  const fn = jest.fn((a: string, b: string) => {
    if (typeof a === 'string') return 1;
    if (typeof b === 'string') return -1;
    return 0;
  });
  expect(profile({} as NormalizedOptions, fn)('a', 'b')).toBe(1);
  expect(fn).toBeCalledWith('a', 'b');
});
