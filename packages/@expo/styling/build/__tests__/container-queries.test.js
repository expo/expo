import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';
const Parent = createMockComponent();
const Child = createMockComponent();
beforeEach(() => {
    StyleSheet.__reset();
});
describe('size', () => {
    test('width', async () => {
        registerCSS(`
      .container { 
        container-name: test; 
        width: 200px;
      }

      .child {
        color: red;
      }

      @container (width > 400px) {
        .child {
          color: blue;
        }
      }
    `);
        const { rerender } = render(React.createElement(Parent, { testID: "parent", className: "container" },
            React.createElement(Child, { className: "child" })));
        const parent = await screen.findByTestId('parent');
        expect(Parent).styleToEqual({
            width: 200,
        });
        expect(Child).styleToEqual({
            color: 'rgba(255, 0, 0, 1)',
        });
        fireEvent(parent, 'layout', {
            nativeEvent: {
                layout: {
                    width: 200,
                    height: 200,
                },
            },
        });
        expect(Child).styleToEqual({
            color: 'rgba(255, 0, 0, 1)',
        });
        rerender(React.createElement(Parent, { className: "container", style: { width: 500 } },
            React.createElement(Child, { className: "child" })));
        fireEvent(parent, 'layout', {
            nativeEvent: {
                layout: {
                    width: 500,
                    height: 200,
                },
            },
        });
        expect(Parent).styleToEqual({
            width: 500,
        });
        expect(Child).styleToEqual({
            color: 'rgba(0, 0, 255, 1)',
        });
    });
});
//# sourceMappingURL=container-queries.test.js.map