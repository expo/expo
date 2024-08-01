import * as babel from '@babel/core';

import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',
  babelrc: false,
  presets: [preset],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: true,
  caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios' }),
};

it(`compiles React auto jsx import`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true }),
  };

  const sourceCode = `
function App() {
    return <div />
}`;
  expect(babel.transform(sourceCode, options)!.code).toMatchInlineSnapshot(`
    "var _jsxDevRuntime = require("react/jsx-dev-runtime");var _jsxFileName = "/unknown";
    function App() {
      return /*#__PURE__*/(0, _jsxDevRuntime.jsxDEV)("div", {}, void 0, false, { fileName: _jsxFileName, lineNumber: 3, columnNumber: 12 }, this);
    }"
  `);

  const productionOptions = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: false }),
  };
  expect(babel.transform(sourceCode, productionOptions)!.code).toMatchInlineSnapshot(`
    "var _jsxRuntime = require("react/jsx-runtime");
    function App() {
      return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {});
    }"
  `);
});

it(`transforms React display name`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true }),
  };

  // Ensure no duplication
  const sourceCode = `
  var bar = createReactClass({});
  `;
  expect(babel.transform(sourceCode, options)!.code).toMatchInlineSnapshot(`
    "
    var bar = createReactClass({ displayName: "bar" });"
  `);
});

describe('classic runtime', () => {
  // No React import...
  const sourceCode = `
  import { View } from 'react-native';
  export default function App() {
    return <View />
  }`;

  it(`compiles for Webpack in dev`, () => {
    const options = {
      ...DEF_OPTIONS,
      presets: [[preset, { jsxRuntime: 'classic' }]],
      caller: getCaller({
        name: 'babel-loader',
        isDev: true,
      }),
    };

    const code = babel.transform(sourceCode, options)!.code;

    expect(code).not.toMatch(/"react\/jsx-runtime"/);
    expect(code).not.toMatch(/_jsx\(View/);
    expect(code).toMatchInlineSnapshot(`
      "var _jsxFileName = "/unknown";import View from "react-native-web/dist/exports/View";

      export default function App() {
        return /*#__PURE__*/React.createElement(View, { __self: this, __source: { fileName: _jsxFileName, lineNumber: 4, columnNumber: 12 } });
      }"
    `);
  });
  it(`compiles for Webpack in prod`, () => {
    const options = {
      ...DEF_OPTIONS,
      presets: [[preset, { jsxRuntime: 'classic' }]],
      caller: getCaller({
        name: 'babel-loader',
        isDev: false,
      }),
    };

    const code = babel.transform(sourceCode, options)!.code;

    expect(code).not.toMatch(/"react\/jsx-runtime"/);
    expect(code).not.toMatch(/_jsx\(View/);
    expect(code).toMatchInlineSnapshot(`
      "import View from "react-native-web/dist/exports/View";

      export default function App() {
        return /*#__PURE__*/React.createElement(View, null);
      }"
    `);
  });

  ['ios', 'web'].forEach((platform) => {
    it(`compiles for Metro ${platform} in dev`, () => {
      const options = {
        ...DEF_OPTIONS,
        presets: [[preset, { jsxRuntime: 'classic' }]],
        caller: getCaller({
          name: 'metro',
          platform,
          isDev: true,
        }),
      };

      const code = babel.transform(sourceCode, options)!.code;

      expect(code).not.toMatch(/"react\/jsx-runtime"/);
      // Format is a little different for Metro
      expect(code).not.toMatch(/_jsxRuntime\.jsx/);
      expect(code).toMatchSnapshot();
    });
    it(`compiles for Metro ${platform} in prod`, () => {
      const options = {
        ...DEF_OPTIONS,
        presets: [[preset, { jsxRuntime: 'classic' }]],
        caller: getCaller({
          name: 'metro',
          platform,
          isDev: false,
        }),
      };

      const code = babel.transform(sourceCode, options)!.code;

      expect(code).not.toMatch(/"react\/jsx-runtime"/);
      // Format is a little different for Metro
      expect(code).not.toMatch(/_jsxRuntime\.jsx/);
      expect(code).toMatchSnapshot();
    });
  });
});

// This tests that `@babel/preset-react` works as expected in development for edge-cases.
it(`supports nested React components in destructured props in Metro + development + hermes`, () => {
  const options = {
    ...DEF_OPTIONS,
    presets: [[preset, { jsxRuntime: 'automatic' }]],
    caller: getCaller({
      name: 'metro',
      platform: 'ios',
      engine: 'hermes',
      isDev: true,
    }),
    retainLines: false,
  };

  const sourceCode = `
  function Foo({
    button = () => {
      return <Text>Foo</Text>;
    },
  }) {
    return <>{button()}</>;
  }`;

  const code = babel.transform(sourceCode, options)!.code;

  expect(code).toMatch(/"react\/jsx-dev-runtime"/);
  expect(code).toMatch(/var _ref\$button/);
  expect(code).toMatchInlineSnapshot(`
    "var _jsxDevRuntime = require("react/jsx-dev-runtime");
    var _jsxFileName = "/unknown";
    function Foo(_ref) {
      var _ref$button = _ref.button,
        button = _ref$button === void 0 ? () => {
          return /*#__PURE__*/(0, _jsxDevRuntime.jsxDEV)(Text, {
            children: "Foo"
          }, void 0, false, {
            fileName: _jsxFileName,
            lineNumber: 4,
            columnNumber: 14
          }, this);
        } : _ref$button;
      return /*#__PURE__*/(0, _jsxDevRuntime.jsxDEV)(_jsxDevRuntime.Fragment, {
        children: button()
      }, void 0, false);
    }"
  `);
});

describe('auto runtime (default)', () => {
  // No React import...
  const sourceCode = `
  import { View } from 'react-native';
  export default function App() {
    return <View />
  }`;

  it(`compiles for Webpack in dev`, () => {
    const options = {
      ...DEF_OPTIONS,
      presets: [[preset, { jsxRuntime: 'automatic' }]],
      caller: getCaller({
        name: 'babel-loader',
        isDev: true,
      }),
    };

    const code = babel.transform(sourceCode, options)!.code;

    expect(code).toMatch(/"react\/jsx-dev-runtime"/);
    expect(code).not.toMatch(/_jsx\(View/);
    expect(code).toMatchInlineSnapshot(`
      "var _jsxFileName = "/unknown";import View from "react-native-web/dist/exports/View";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

      export default function App() {
        return /*#__PURE__*/_jsxDEV(View, {}, void 0, false, { fileName: _jsxFileName, lineNumber: 4, columnNumber: 12 }, this);
      }"
    `);
  });
  it(`compiles for Webpack in prod`, () => {
    const options = {
      ...DEF_OPTIONS,
      presets: [[preset, { jsxRuntime: 'automatic' }]],
      caller: getCaller({
        name: 'babel-loader',
        isDev: false,
      }),
    };

    const code = babel.transform(sourceCode, options)!.code;

    expect(code).toMatch(/"react\/jsx-runtime"/);
    expect(code).toMatch(/_jsx\(View/);
    expect(code).toMatchInlineSnapshot(`
      "import View from "react-native-web/dist/exports/View";import { jsx as _jsx } from "react/jsx-runtime";

      export default function App() {
        return /*#__PURE__*/_jsx(View, {});
      }"
    `);
  });

  ['ios', 'web'].forEach((platform) => {
    it(`compiles for Metro ${platform} in dev`, () => {
      const options = {
        ...DEF_OPTIONS,
        presets: [[preset, { jsxRuntime: 'automatic' }]],
        caller: getCaller({
          name: 'metro',
          platform,
          isDev: true,
        }),
      };

      const code = babel.transform(sourceCode, options)!.code;

      expect(code).toMatch(/"react\/jsx-dev-runtime"/);
      // Format is a little different for Metro
      expect(code).not.toMatch(/_jsxRuntime\.jsx/);
      expect(code).toMatchSnapshot();
    });
    it(`compiles for Metro ${platform} in prod`, () => {
      const options = {
        ...DEF_OPTIONS,
        presets: [[preset, { jsxRuntime: 'automatic' }]],
        caller: getCaller({
          name: 'metro',
          platform,
          isDev: false,
        }),
      };

      const code = babel.transform(sourceCode, options)!.code;

      expect(code).toMatch(/"react\/jsx-runtime"/);
      // Format is a little different for Metro
      expect(code).toMatch(/_jsxRuntime\.jsx/);
      expect(code).toMatchSnapshot();
    });
  });
});
