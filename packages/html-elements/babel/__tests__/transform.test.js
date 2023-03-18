const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const plugin = require('../../babel');

const options = {
  babelrc: false,
  presets: [
    [
      require.resolve('metro-react-native-babel-preset'),
      {
        useTransformReactJSXExperimental: false,
        disableImportExportTransform: true,
      },
    ],
  ],
  caller: {
    name: 'metro',
    platform: 'ios',
  },
  minified: false,
  plugins: [plugin],
  compact: false,

  filename: 'unknown',
  // Snapshot sanity
  retainLines: true,
  cwd: __dirname,
  babelrcRoots: false,
};

it(`Doesn't support unknowns`, () => {
  const sourceCode = `
function App() {
  return <foobar href="#">Link</foobar>;
}`;
  const { code } = babel.transform(sourceCode, options);
  expect(code).toMatchSnapshot();
  expect(code).not.toMatch(`@expo/html-elements`);
});

it(`Skips html and body on web`, () => {
  const sourceCode = `
function App() {
  return <html><body>Test</body></html>;
}`;
  const { code } = babel.transform(sourceCode, {
    ...options,
    caller: {
      ...options.caller,
      platform: 'web',
    },
  });
  expect(code).toMatch(`_jsx("html", { children: _jsx("body", { children: "Test" }) });`);
  const { code: nativeCode } = babel.transform(sourceCode, options);
  expect(nativeCode).toMatch(`_jsx(Div, { children: _jsx(Div, { children: "Test" }) });`);
});

it(`Skips conversion in node modules`, () => {
  const sourceCode = `
function App() {
  return <a href="#">Link</a>;    
}`;
  const { code } = babel.transform(sourceCode, {
    ...options,
    filename: '/node_modules/foo/bar.js',
  });
  expect(code).not.toMatch(`import { A } from "@expo/html-elements";`);
});

it(`Converts basic link`, () => {
  const sourceCode = `
function App() {
  return <a href="#">Link</a>;    
}`;
  const { code } = babel.transform(sourceCode, options);
  expect(code).toMatchSnapshot();
  expect(code).toMatch(`import { A } from "@expo/html-elements";`);
});

it(`Skips injecting the import if one is already present`, () => {
  const sourceCode = `
import '@expo/html-elements';
function App() {
  return <a href="#">Link</a>;    
}`;
  const { code } = babel.transform(sourceCode, options);
  expect(code).toMatchSnapshot();
});

it(`Converts fixture`, () => {
  const sourceCode = fs.readFileSync(path.join(__dirname, 'fixtures/one.js'), 'utf8');
  const { code } = babel.transform(sourceCode, options);
  expect(code).toMatchSnapshot();
});
