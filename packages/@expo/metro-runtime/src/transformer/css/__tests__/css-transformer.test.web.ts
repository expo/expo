import {
  matchCssModule,
  getHotReplaceTemplate,
  transform,
  pathToHtmlSafeName,
} from '../css-transformer';

describe(transform, () => {
  it(`should transform css in dev mode`, async () => {
    const result = await transform({
      filename: 'test.css',
      src: 'body { color: red; }',
      options: {
        platform: 'web',
        dev: true,
        hot: true,
      } as any,
    });

    expect(result.src).toMatchSnapshot();

    expect(result.src).toMatch(/expo-css-hmr/);
  });

  it(`should transform css in prod mode`, async () => {
    const result = await transform({
      filename: 'test.css',
      src: 'body { color: red; }',
      options: {
        platform: 'web',
        dev: false,
        hot: false,
      } as any,
    });

    expect(result.src).toMatchSnapshot();

    expect(result.src).not.toMatch(/expo-css-hmr/);
  });

  it(`should skip transforming css modules`, async () => {
    const result = await transform({
      filename: 'test.module.css',
      src: 'body { color: red; }',
      options: {
        platform: 'web',
        dev: false,
        hot: false,
      } as any,
    });

    expect(result.src).toEqual('module.exports = {}');
  });

  it(`should shim css on native`, async () => {
    const result = await transform({
      filename: 'test.css',
      src: 'body { color: red; }',
      options: {
        platform: 'ios',
        dev: false,
        hot: false,
      } as any,
    });

    expect(result.src).toEqual('');
  });
  it(`should shim css on native with comment in dev`, async () => {
    const result = await transform({
      filename: 'test.css',
      src: 'body { color: red; }',
      options: {
        platform: 'ios',
        dev: true,
        hot: false,
      } as any,
    });

    expect(result.src).toMatchSnapshot();
  });
});

describe(pathToHtmlSafeName, () => {
  it(`converts filepath to safe name`, () => {
    expect(pathToHtmlSafeName('foo')).toEqual('foo');
    expect(pathToHtmlSafeName('../123/abc/something.module.css')).toEqual(
      '___123_abc_something_module_css'
    );
  });
});

describe(getHotReplaceTemplate, () => {
  it(`should generate the correct template`, () => {
    expect(getHotReplaceTemplate('foo')).toMatchSnapshot();
  });
});

describe(matchCssModule, () => {
  it(`should match css modules`, () => {
    [
      'test.module.css',
      'test.module.ios.css',
      'test.module.android.css',
      'test.module.native.css',
      'test.module.web.css',

      '.module.css',
      'something-longer.module.css',
      '../../foo-bar.module.css',
      './one/two/three/another.module.ios.css',
    ].forEach((file) => expect(matchCssModule(file)).toBe(true));
  });
  it(`should not match css modules`, () => {
    [
      'foo.js',
      'something',
      'one/two/three',
      'test.css',
      'test.ios.css',
      'test.android.css',
      'test.native.css',
      'test.web.css',
      'test.scss',
      'test.sass',
      '.css',
      '../../foo-bar.css',
      './one/two/three/another.ios.css',
    ].forEach((file) => expect(matchCssModule(file)).toBe(false));
  });
});
