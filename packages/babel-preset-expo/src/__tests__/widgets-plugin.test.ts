/**
 * Copyright © 2026 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  isReactServer: false,
  platform: 'ios',
  projectRoot: '/',
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  filename: '/unknown',
  babelrc: false,
  presets: [preset],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
  caller: getCaller({ ...ENABLED_CALLER }),
};

function transformTest(sourceCode: string) {
  const options = { ...DEF_OPTIONS };

  const results = babel.transform(sourceCode, options);
  if (!results) throw new Error('Failed to transform code');

  return {
    code: results.code,
  };
}

describe('widgets-plugin', () => {
  describe('detection', () => {
    it('does not transform non-widget components', () => {
      const result = transformTest(`
        function MyComponent({ name }) {
          return <Text>My not 'widget' component</Text>;
        }
      `);

      expect(result.code).toContain("'widget'");
    });

    it("removes 'widget' directive from widget components", () => {
      const result = transformTest(`
        function MyComponent({ name }) {
          'widget';
          return <Text>{name}</Text>;
        }
      `);

      expect(result.code).not.toContain("'widget'");
    });
  });

  describe('transform', () => {
    it('stringifies widget function after JSX transform', () => {
      const backtick = '`';
      const result = transformTest(`
        function MyComponent({ name }) {
          'widget';
          return <Text><Text>{name + \`sadaas\`}</Text></Text>;
        }
      `);

      expect(result.code).toContain('var MyComponent = `function');
      expect(result.code).toContain('jsx(');
    });

    it('handles fragments', () => {
      const result = transformTest(`
        function MyComponent({ name }) {
          'widget';
          return <Text><>{name}</></Text>;
        }
      `);

      expect(result.code).toContain('var MyComponent = `function');
      expect(result.code).toContain('jsx(_Fragment');
    });
  });
});
