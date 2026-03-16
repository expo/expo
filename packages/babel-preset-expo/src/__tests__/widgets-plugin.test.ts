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

function transformTest(sourceCode: string, opts?: Partial<typeof DEF_OPTIONS>) {
  const options = { ...DEF_OPTIONS, ...opts };
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
      const result = transformTest(`
        function MyComponent({ name }) {
          'widget';
          return <Text><Text>{name + \`sadaas\`}</Text></Text>;
        }
      `);

      expect(result.code).toContain('var MyComponent = `function');
      expect(result.code).toContain('jsx(');
    });

    it('stringifies widget arrow function after JSX transform', () => {
      const result = transformTest(`
        const MyComponent = ({ name }) => {
          'widget';
          return <Text><Text>{name + \`sadaas\`}</Text></Text>;
        }
      `);

      expect(result.code).not.toContain("'widget'");
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

    it('adds a target prop to Button elements in widget components', () => {
      const result = transformTest(`
        import { Button } from '@expo/ui/swift-ui';

        function MyComponent() {
          'widget';
          return <Button title="Tap" />;
        }
      `);

      expect(result.code).toMatch(/target:"__expo_widgets_target_\d+"/);
    });

    it('does not modify normal components', () => {
      const result = transformTest(`
        function MyComponent() {
          return <Button title="Tap" />;
        }
      `);

      expect(result.code).not.toMatch(/target:"__expo_widgets_target_\d+"/);
    });

    it('includes the nearest parent key in generated Button targets', () => {
      const result = transformTest(`
        import { Button } from '@expo/ui/swift-ui';

        function MyComponent() {
          'widget';
          return (
            <View key="row-1">
              <Button title="Tap" />
            </View>
          );
        }
      `);

      expect(result.code).toMatch(/target:"__expo_widgets_target_\d+__row-1"/);
    });

    it('keeps nearest parent keys dynamic when they come from expressions', () => {
      const result = transformTest(`
        import { Button } from '@expo/ui/swift-ui';

        function MyComponent({ items }) {
          'widget';
          return items.map((item, index) => (
            <View key={index}>
              <Button title={item.title} />
            </View>
          ));
        }
      `);

      expect(result.code).toMatch(/target:\\`__expo_widgets_target_\d+__/);
      expect(result.code).toContain('\\${index}');
    });

    it('walks up to the nearest keyed JSX ancestor through nested elements', () => {
      const result = transformTest(`
        import { Button } from '@expo/ui/swift-ui';

        function MyComponent({ items }) {
          'widget';
          return items.map((item, index) => (
            <View key={index}>
              <View>
                <Button title={item.title} />
              </View>
            </View>
          ));
        }
      `);

      expect(result.code).toMatch(/target:\\`__expo_widgets_target_\d+__/);
      expect(result.code).toContain('\\${index}');
    });

    it('adds a target prop to aliased Button imports from swift-ui', () => {
      const result = transformTest(`
        import { Button as SwiftUIButton } from '@expo/ui/swift-ui';

        function MyComponent() {
          'widget';
          return <SwiftUIButton title="Tap" />;
        }
      `);

      expect(result.code).toMatch(/target:"__expo_widgets_target_\d+"/);
    });

    it('adds a target prop to * Button imports from swift-ui', () => {
      const result = transformTest(`
        import * as SwiftUI from '@expo/ui/swift-ui';

        function MyComponent() {
          'widget';
          return <SwiftUI.Button title="Tap" />;
        }
      `);

      expect(result.code).toMatch(/target:"__expo_widgets_target_\d+"/);
    });

    it('does not modify Button imported from a different module', () => {
      const result = transformTest(`
        import { Button } from 'react-native';

        function MyComponent() {
          'widget';
          return <Button title="Tap" />;
        }
      `);

      expect(result.code).not.toMatch(/target:"__expo_widgets_target_\d+"/);
    });
  });

  describe('react-compiler', () => {
    const COMPILER_OPTS = {
      caller: getCaller({
        ...ENABLED_CALLER,
        supportsReactCompiler: true,
      }),
    };

    it('stringifies widget function with react compiler enabled', () => {
      const result = transformTest(
        `
        function MyComponent({ name }) {
          'widget';
          return <Text><Text>{name + \`sadaas\`}</Text></Text>;
        }
      `,
        COMPILER_OPTS
      );

      // Shouldn't add the compiler, since we're opting out
      expect(result.code).not.toContain('react/compiler-runtime');
      expect(result.code).toContain('var MyComponent = `function');
      expect(result.code).toContain('jsx(');
    });
  });
});
