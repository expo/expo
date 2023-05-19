import { fireEvent, render } from '@testing-library/react-native';
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
        React.createElement(B, { className: "my-class" })));
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
test('multiple groups', async () => {
    const A = createMockComponent();
    const B = createMockComponent();
    registerCSS(`.valid .my-class { 
      color: red;
    }`, {
        grouping: ['^group\\/.*', '^valid'],
    });
    const { rerender } = render(React.createElement(B, { className: "my-class" }));
    expect(B).styleToEqual({});
    rerender(React.createElement(A, { testID: "A", className: "valid" },
        React.createElement(B, { className: "my-class" })));
    expect(B).styleToEqual({ color: 'rgba(255, 0, 0, 1)' });
});
test('groups - pseudo classes', async () => {
    const A = createMockComponent();
    const B = createMockComponent();
    registerCSS(`.btn:active .btn-text { 
      color: red;
    }`, {
        grouping: ['^btn$'],
    });
    const { findByTestId } = render(React.createElement(A, { testID: "A", className: "btn" },
        React.createElement(B, { className: "btn-text" })));
    const aComponent = await findByTestId('A');
    expect(B).styleToEqual({});
    fireEvent(aComponent, 'pressIn');
    expect(B).styleToEqual({ color: 'rgba(255, 0, 0, 1)' });
});
//# sourceMappingURL=selectors.test.js.map