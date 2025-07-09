import {
  escapeBackticksAndOctals,
  getHotReplaceTemplate,
  wrapDevelopmentCSS,
  pathToHtmlSafeName,
} from '../css';

describe(escapeBackticksAndOctals, () => {
  it(`should escape backticks and octals`, () => {
    expect(escapeBackticksAndOctals('`')).toEqual('\\`');
    expect(escapeBackticksAndOctals('`\\0')).toEqual('\\`\\\\0');
  });
});

describe(wrapDevelopmentCSS, () => {
  it(`should transform css in dev mode`, async () => {
    const result = await wrapDevelopmentCSS({
      filename: 'test.css',
      src: 'body { color: red; }',
      reactServer: false,
    });

    expect(result).toMatchSnapshot();
    expect(result).toMatch(/expo-css-hmr/);
  });

  it(`should transform css in dev mode for server components`, async () => {
    const result = await wrapDevelopmentCSS({
      filename: 'test.css',
      src: 'body { color: red; }',
      reactServer: true,
    });

    expect(result).toMatchSnapshot();
    expect(result).toMatch(/expo-css-hmr/);
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
