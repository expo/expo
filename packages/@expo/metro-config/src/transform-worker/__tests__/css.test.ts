import { getHotReplaceTemplate, wrapDevelopmentCSS, pathToHtmlSafeName } from '../css';

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

  it(`safely embeds CSS bodies that contain '\${' and backticks`, () => {
    // CSS bodies can legitimately contain `${` (eg. inside a `content:` string)
    // or backticks. The legacy template-literal path interpolated `${...}` as
    // an expression; the JSON-stringify path produces a plain string literal
    // whose `${` and `` ` `` are inert.
    const src = "body::before { content: '\\${not interpolated}`'; }";
    const result = wrapDevelopmentCSS({ filename: 'test.css', src, reactServer: false });
    expect(result).toContain(JSON.stringify(src));
    expect(result).not.toContain('`' + src + '`');
  });

  it(`emits ES5 syntax (var + function IIFE, no template literals or arrows)`, () => {
    // The CSS shim path bypasses babel-preset-expo, so any non-ES5 syntax here
    // would survive untouched into older browsers that some browserslist configs
    // still target.
    const result = wrapDevelopmentCSS({
      filename: 'test.css',
      src: 'body { color: red; }',
      reactServer: false,
    });
    expect(result).not.toMatch(/\b(?:const|let)\b/);
    expect(result).not.toMatch(/=>/);
    expect(result).not.toMatch(/`/);
    expect(result).toContain('(function () {');
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
