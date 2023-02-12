import { vol } from 'memfs';

import { findUpProjectRootOrAssert } from '../findUp';

describe(findUpProjectRootOrAssert, () => {
  beforeEach(() => {
    vol.reset();
  });
  it('gets project root', () => {
    vol.fromJSON(
      {
        '/foo/bar/package.json': '{}',
        '/foo/bar/another/index': '',
      },
      '.'
    );
    expect(findUpProjectRootOrAssert('/foo/bar/another/index')).toBe('/foo/bar');
  });

  it('throws if project root not found', () => {
    vol.fromJSON(
      {
        '/foo/bar/another/index': '',
      },
      '.'
    );
    expect(() =>
      findUpProjectRootOrAssert('/foo/bar/another/index')
    ).toThrowErrorMatchingInlineSnapshot(
      `"Project root directory not found (working directory: /foo/bar/another/index)"`
    );
  });
});
