import { resolveXcodeBuildSetting, sanitizedName } from '../Xcodeproj';

describe(sanitizedName, () => {
  it(`formats basic name`, () => {
    expect(sanitizedName('bacon')).toBe('bacon');
  });
  it(`formats android/xcode unsupported name`, () => {
    expect(sanitizedName('あいう')).toBe('app');
  });
  it(`uses slugify for better name support`, () => {
    expect(sanitizedName('\u2665')).toBe('love');
  });
});

describe(resolveXcodeBuildSetting, () => {
  it(`resolves build setting`, () => {
    const lookup = jest.fn(
      (v) =>
        ({
          CURRENT_VARIANT: 'variant',
          PLATFORM_PREFERRED_ARCH: 'arch',
          LINK_FILE_LIST_variant_arch: './../foo/./bar.js',
        })[v]
    );
    const r = resolveXcodeBuildSetting(
      '$(LINK_FILE_LIST_$(CURRENT_VARIANT)_$(PLATFORM_PREFERRED_ARCH):dir:standardizepath:file:default=arm64)',
      lookup
    );
    expect(lookup).toHaveBeenNthCalledWith(1, 'CURRENT_VARIANT');
    expect(lookup).toHaveBeenNthCalledWith(2, 'PLATFORM_PREFERRED_ARCH');
    expect(lookup).toHaveBeenNthCalledWith(3, 'LINK_FILE_LIST_variant_arch');
    expect(lookup).toBeCalledTimes(3);
    expect(r).toBe('foo');
  });
  it(`resolves build setting using "default" modifier`, () => {
    const lookup = jest.fn((v) => ({})[v]);
    const r = resolveXcodeBuildSetting('$(LINK_FILE_LIST:default=arm64)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'LINK_FILE_LIST');
    expect(lookup).toBeCalledTimes(1);
    expect(r).toBe('arm64');
  });
  it(`resolves build settings looked up with more build settings`, () => {
    const lookup = jest.fn((v) => ({ FOO: '$(BAR:lower)', BAR: '$(hey)', hey: 'Found' })[v]);
    const r = resolveXcodeBuildSetting('$(FOO)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(lookup).toHaveBeenNthCalledWith(2, 'BAR');
    expect(lookup).toHaveBeenNthCalledWith(3, 'hey');
    expect(lookup).toBeCalledTimes(3);
    expect(r).toBe('found');
  });
  it(`resolves build setting using "default" modifier with variable`, () => {
    const lookup = jest.fn((v) => ({ FOO: 'FOO' })[v]);
    const r = resolveXcodeBuildSetting('$(LINK_FILE_LIST:default=$(FOO:lower))', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(lookup).toHaveBeenNthCalledWith(2, 'LINK_FILE_LIST');
    expect(lookup).toBeCalledTimes(2);
    expect(r).toBe('foo');
  });
  it(`resolves with "rfc1034identifier" modifier`, () => {
    const lookup = jest.fn((v) => ({ FOO: 'ab/cd-e_f.g h*' })[v]);
    const r = resolveXcodeBuildSetting('$(FOO:rfc1034identifier)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(r).toBe('ab-cd-e-f-g-h-');
  });
  it(`resolves with "c99extidentifier" modifier`, () => {
    const lookup = jest.fn((v) => ({ FOO: 'ab/cd-e_f.g h*' })[v]);
    const r = resolveXcodeBuildSetting('$(FOO:c99extidentifier)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(r).toBe('ab/cd_e_f.g_h*');
  });
  it(`resolves with "base" modifier`, () => {
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar.js' })[v])).toBe('bar');
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar' })[v])).toBe('bar');
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar.' })[v])).toBe('bar');
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar.d.ts' })[v])).toBe(
      'bar.d'
    );
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: 'bar.ts' })[v])).toBe('bar');
  });
  it(`resolves with "suffix" modifier`, () => {
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar.js' })[v])).toBe(
      '.js'
    );
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar' })[v])).toBe('');
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar.' })[v])).toBe('.');
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar.d.ts' })[v])).toBe(
      '.ts'
    );
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: 'bar.ts' })[v])).toBe('.ts');
  });

  it(`resolves a common bundle identifier pattern`, () => {
    expect(
      resolveXcodeBuildSetting(
        'org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)',
        (setting) => ({ PRODUCT_NAME: 'foo_-bar' })[setting]
      )
    ).toBe('org.reactjs.native.example.foo--bar');
  });
});
