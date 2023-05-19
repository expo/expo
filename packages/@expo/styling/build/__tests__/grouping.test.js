import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';
afterEach(() => {
    StyleSheet.__reset();
});
test('group', async () => {
    const A = createMockComponent();
    const B = createMockComponent();
    registerCSS(`.group\\/item .my-class { 
      color: red;
    }`, {
        grouping: ['^group\\/.*'],
    });
    const { rerender } = render(React.createElement(B, { className: "my-class" }));
    expect(B).styleToEqual({});
    rerender(React.createElement(A, { testID: "A", className: "group/item" },
        React.createElement(B, { testID: "B", className: "my-class" })));
    expect(B).styleToEqual({ color: 'rgba(255, 0, 0, 1)' });
});
test('invalid group', async () => {
    const A = createMockComponent();
    const B = createMockComponent();
    registerCSS(`.invalid .my-class { 
      color: red;
    }`, {
        grouping: ['^group\\/.*'],
    });
    const { rerender } = render(React.createElement(B, { className: "my-class" }));
    expect(B).styleToEqual(undefined);
    rerender(React.createElement(A, { testID: "A", className: "invalid" },
        React.createElement(B, { className: "my-class" })));
    expect(B).styleToEqual(undefined);
});
//# sourceMappingURL=grouping.test.js.map