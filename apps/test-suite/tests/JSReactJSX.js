/* eslint-disable */
'use strict';

// Tests for React JSX development annotations (__source and __self).
//
// The React Native babel preset uses plugin-transform-react-jsx with
// { runtime: 'automatic' } (development: false), generating jsx()/jsxs()
// calls. The jsx-source and jsx-self plugins add __source/__self as JSX
// attributes, but the automatic transform extracts and drops them since
// development is false. They are completely dead code.
//
// In React 19, jsx()/jsxs()/jsxDEV() all capture their own stack trace via
// Error("react-stack-top-frame") and store it as _debugStack on the element.
// There is no _source or _self property — React 19 removed them entirely.
// The _debugStack Error uses Hermes native stack traces for source location.
//
// These tests validate:
// 1. React 19 elements have _debugStack, not _source/_self
// 2. _debugStack uses Hermes native stack traces for source location
// 3. __source/__self do not leak into props
// 4. Component identification works without __source

export const name = 'JS React JSX';

export function test({ describe, it, xit, expect }) {
  const React = require('react');

  function Dummy() {
    return null;
  }

  describe('JS React JSX', () => {
    describe('React 19 element shape', () => {
      it('JSX element does not have _source property', () => {
        const el = <Dummy />;
        // React 19 removed _source — it is not defined on elements
        expect('_source' in el).toBe(false);
      });

      it('JSX element does not have _self property', () => {
        const el = <Dummy />;
        // React 19 removed _self — it is not defined on elements
        expect('_self' in el).toBe(false);
      });

      it('JSX element has _debugStack', () => {
        const el = <Dummy />;
        // React 19 captures the creation-site stack via Error()
        expect('_debugStack' in el).toBe(true);
        expect(el._debugStack != null).toBe(true);
      });

      it('_debugStack is an Error object', () => {
        const el = <Dummy />;
        expect(el._debugStack instanceof Error).toBe(true);
      });

      it('_debugStack has message "react-stack-top-frame"', () => {
        const el = <Dummy />;
        expect(el._debugStack.message).toBe('react-stack-top-frame');
      });

      it('_debugStack has a stack trace string', () => {
        const el = <Dummy />;
        const stack = el._debugStack.stack;
        expect(typeof stack).toBe('string');
        expect(stack.length > 0).toBe(true);
      });

      it('JSX element has _debugTask', () => {
        const el = <Dummy />;
        // _debugTask is set for async debugging (null if console.createTask unavailable)
        expect('_debugTask' in el).toBe(true);
      });

      it('createElement also produces _debugStack', () => {
        const el = React.createElement(Dummy, null);
        // createElement in React 19 also captures Error("react-stack-top-frame")
        expect(el._debugStack instanceof Error).toBe(true);
      });

      it('createElement element does not have _source', () => {
        const el = React.createElement(Dummy, null);
        expect('_source' in el).toBe(false);
      });

      it('createElement element does not have _self', () => {
        const el = React.createElement(Dummy, null);
        expect('_self' in el).toBe(false);
      });
    });

    describe('_debugStack source location', () => {
      it('_debugStack.stack has source location frames', () => {
        const el = <Dummy />;
        const stack = el._debugStack.stack || '';
        // Raw Hermes stacks reference the bundle, not original source files.
        // Source filenames are available after symbolication (DevTools, error overlay).
        expect(/:\d+:\d+/.test(stack)).toBe(true);
      });

      it('_debugStack.stack contains line:col numbers', () => {
        const el = <Dummy />;
        const stack = el._debugStack.stack || '';
        expect(/:\d+:\d+/.test(stack)).toBe(true);
      });

      it('elements on different lines have different _debugStack', () => {
        const el1 = <Dummy />;

        const el2 = <Dummy />;
        // Created on different lines, so the captured stacks differ
        expect(el1._debugStack.stack).not.toBe(el2._debugStack.stack);
      });

      it('_debugStack captures the calling function name', () => {
        function createWidget() {
          return <Dummy />;
        }
        const el = createWidget();
        const stack = el._debugStack.stack || '';
        expect(stack.indexOf('createWidget') >= 0).toBe(true);
      });

      it('_debugStack captures class method name', () => {
        class WidgetFactory {
          build() {
            return <Dummy />;
          }
        }
        const el = new WidgetFactory().build();
        const stack = el._debugStack.stack || '';
        expect(stack.indexOf('build') >= 0).toBe(true);
      });

      it('_debugStack captures arrow function name', () => {
        const makeElement = () => <Dummy />;
        const el = makeElement();
        const stack = el._debugStack.stack || '';
        expect(stack.indexOf('makeElement') >= 0).toBe(true);
      });

      it('children have independent _debugStack', () => {
        function Parent({ children }) {
          return null;
        }
        function Child() {
          return null;
        }
        const parent = (
          <Parent>
            <Child />
          </Parent>
        );
        const child = parent.props.children;
        expect(parent._debugStack.stack).not.toBe(child._debugStack.stack);
      });

      it('createElement _debugStack has source location', () => {
        const el = React.createElement(Dummy, null);
        const stack = el._debugStack.stack || '';
        expect(/:\d+:\d+/.test(stack)).toBe(true);
      });
    });

    describe('_debugStack vs __source equivalence', () => {
      // __source used to provide { fileName, lineNumber, columnNumber }.
      // _debugStack.stack provides the same info (and more: full call chain)
      // via Hermes native stack traces.

      it('_debugStack.stack has source location (replaces __source.fileName/lineNumber/columnNumber)', () => {
        const el = <Dummy />;
        const stack = el._debugStack.stack || '';
        // __source provided { fileName, lineNumber, columnNumber } statically.
        // _debugStack captures the same via Error().stack — file/line/col are
        // available after symbolication (which DevTools and error overlay perform).
        expect(/:\d+:\d+/.test(stack)).toBe(true);
      });

      it('_debugStack provides full call chain (more than __source)', () => {
        function outerFactory() {
          function innerFactory() {
            return <Dummy />;
          }
          return innerFactory();
        }
        const el = outerFactory();
        const stack = el._debugStack.stack || '';
        // __source only had the immediate creation site.
        // _debugStack has the full call chain — both functions visible.
        expect(stack.indexOf('innerFactory') >= 0).toBe(true);
        expect(stack.indexOf('outerFactory') >= 0).toBe(true);
      });

      it('manual Error().stack matches _debugStack format', () => {
        const el = <Dummy />;
        const err = new Error('manual');
        // Both use the same Hermes stack trace mechanism
        expect(/:\d+:\d+/.test(el._debugStack.stack || '')).toBe(true);
        expect(/:\d+:\d+/.test(err.stack || '')).toBe(true);
      });
    });

    describe('__source and __self prop stripping', () => {
      it('__source does not leak into JSX element props', () => {
        const el = <Dummy />;
        expect(el.props.__source).toBe(undefined);
      });

      it('__self does not leak into JSX element props', () => {
        const el = <Dummy />;
        expect(el.props.__self).toBe(undefined);
      });

      it('createElement strips __source from props', () => {
        const el = React.createElement(Dummy, {
          __source: { fileName: 'fake.js', lineNumber: 1, columnNumber: 0 },
          label: 'hello',
        });
        // React 19 strips __source from props (line 961-962 of react.development.js)
        expect(el.props.__source).toBe(undefined);
        expect(el.props.label).toBe('hello');
      });

      it('createElement strips __self from props', () => {
        const el = React.createElement(Dummy, {
          __self: {},
          label: 'hello',
        });
        // React 19 strips __self from props (line 961 of react.development.js)
        expect(el.props.__self).toBe(undefined);
        expect(el.props.label).toBe('hello');
      });

      it('regular props are preserved alongside stripped __source/__self', () => {
        const el = React.createElement(Dummy, {
          __source: { fileName: 'x.js', lineNumber: 1, columnNumber: 0 },
          __self: {},
          foo: 1,
          bar: 'two',
          baz: true,
        });
        expect(el.props.foo).toBe(1);
        expect(el.props.bar).toBe('two');
        expect(el.props.baz).toBe(true);
        expect(el.props.__source).toBe(undefined);
        expect(el.props.__self).toBe(undefined);
      });
    });

    describe('Hermes native source info', () => {
      it('Error().stack has source location', () => {
        const err = new Error('test');
        const stack = err.stack || '';
        // Raw Hermes stacks have line:col; original filenames after symbolication
        expect(/:\d+:\d+/.test(stack)).toBe(true);
      });

      it('Error().stack has line:col numbers', () => {
        const err = new Error('test');
        expect(/:\d+:\d+/.test(err.stack || '')).toBe(true);
      });

      it('Error().stack preserves function name', () => {
        function renderProfile() {
          return new Error('trace');
        }
        const err = renderProfile();
        expect((err.stack || '').indexOf('renderProfile') >= 0).toBe(true);
      });

      it('Error().stack preserves class method name', () => {
        class Renderer {
          render() {
            return new Error('trace');
          }
        }
        const err = new Renderer().render();
        expect((err.stack || '').indexOf('render') >= 0).toBe(true);
      });

      it('Error().stack preserves arrow function name', () => {
        const buildView = () => new Error('trace');
        const err = buildView();
        expect((err.stack || '').indexOf('buildView') >= 0).toBe(true);
      });

      it('nested call chain is preserved in Error().stack', () => {
        function database() {
          return new Error('query failed');
        }
        function repository() {
          return database();
        }
        function service() {
          return repository();
        }
        const err = service();
        const stack = err.stack || '';
        expect(stack.indexOf('database') >= 0).toBe(true);
        expect(stack.indexOf('repository') >= 0).toBe(true);
        expect(stack.indexOf('service') >= 0).toBe(true);
      });
    });

    describe('component identification without __source', () => {
      it('named function component has type.name', () => {
        function ProfileCard() {
          return null;
        }
        const el = <ProfileCard />;
        expect(el.type.name).toBe('ProfileCard');
      });

      it('displayName is available on type', () => {
        function Comp() {
          return null;
        }
        Comp.displayName = 'FancyButton';
        const el = <Comp />;
        expect(el.type.displayName).toBe('FancyButton');
      });

      it('type.name works with createElement', () => {
        function UserAvatar() {
          return null;
        }
        const el = React.createElement(UserAvatar, null);
        expect(el.type.name).toBe('UserAvatar');
      });

      it('forwardRef render function name is accessible', () => {
        const FancyInput = React.forwardRef(function FancyInput() {
          return null;
        });
        expect(FancyInput.render.name).toBe('FancyInput');
      });

      it('memo preserves inner component name', () => {
        function ExpensiveList() {
          return null;
        }
        const Memoized = React.memo(ExpensiveList);
        expect(Memoized.type.name).toBe('ExpensiveList');
      });

      it('anonymous component has empty name', () => {
        const el = React.createElement(function () {
          return null;
        }, null);
        expect(el.type.name).toBe('');
      });

      it('arrow component assigned to variable has name', () => {
        const MyArrow = () => null;
        const el = <MyArrow />;
        expect(el.type.name).toBe('MyArrow');
      });
    });
  });
}
