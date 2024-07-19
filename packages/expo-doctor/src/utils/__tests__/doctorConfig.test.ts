import { getDirectoryCheckExcludes } from '../doctorConfig';

describe('getDirectoryCheckExcludes', () => {
  it('returns an empty array if no config is present', () => {
    expect(getDirectoryCheckExcludes({})).toEqual([]);
  });

  it('returns an empty array if the config is empty', () => {
    expect(getDirectoryCheckExcludes({ expo: { doctor: {} } })).toEqual([]);
  });

  it('returns an empty array if the config has no excludes', () => {
    expect(getDirectoryCheckExcludes({ expo: { doctor: { directoryCheck: {} } } })).toEqual([]);
  });

  it('parses strings that begin and end with / as regexes', () => {
    expect(
      getDirectoryCheckExcludes({
        expo: { doctor: { directoryCheck: { exclude: ['/foo/', 'bar'] } } },
      })
    ).toEqual([/foo/, 'bar']);
  });

  it('returns an array of strings', () => {
    expect(
      getDirectoryCheckExcludes({
        expo: { doctor: { directoryCheck: { exclude: ['foo', 'bar'] } } },
      })
    ).toEqual(['foo', 'bar']);
  });
});
