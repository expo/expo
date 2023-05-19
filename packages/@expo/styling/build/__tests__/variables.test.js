import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';
const A = createMockComponent();
afterEach(() => {
    StyleSheet.__reset();
});
test('inline variable', () => {
    registerCSS(`.my-class { width: var(--my-var); --my-var: 10px; }`);
    render(React.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        width: 10,
    });
});
test('combined inline variable', () => {
    registerCSS(`
    .my-class-1 { width: var(--my-var); }
    .my-class-2 { --my-var: 10px; }
    .my-class-3 { --my-var: 20px; }
  `);
    render(React.createElement(A, { className: "my-class-1 my-class-2" }));
    expect(A).styleToEqual({
        width: 10,
    });
    // Prove that the order doesn't matter
    screen.rerender(React.createElement(A, { className: "my-class-3 my-class-1" }));
    expect(A).styleToEqual({
        width: 20,
    });
});
test('inherit variables', () => {
    const B = createMockComponent();
    registerCSS(`
    .my-class-1 { width: var(--my-var); }
    .my-class-2 { --my-var: 10px; }
    .my-class-3 { --my-var: 20px; }
  `);
    render(React.createElement(A, { className: "my-class-2" },
        React.createElement(B, { className: "my-class-1" })));
    expect(A).styleToEqual({});
    expect(B).styleToEqual({ width: 10 });
    screen.rerender(React.createElement(A, { className: "my-class-3" },
        React.createElement(B, { className: "my-class-1" })));
    expect(A).styleToEqual({});
    expect(B).styleToEqual({ width: 20 });
});
//# sourceMappingURL=variables.test.js.map