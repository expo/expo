import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';
const A = createMockComponent();
jest.useFakeTimers();
beforeEach(() => {
    StyleSheet.__reset();
});
test('basic animation', () => {
    registerCSS(`
.my-class {
  animation-duration: 3s;
  animation-name: slidein;
}

@keyframes slidein {
  from {
    margin-left: 100%;
  }

  to {
    margin-left: 0%;
  }
}
`);
    const testComponent = render(React.createElement(A, { testID: "test", className: "my-class" })).getByTestId('test');
    expect(testComponent).toHaveAnimatedStyle({
        marginLeft: '100%',
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        marginLeft: '50%',
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        marginLeft: '0%',
    });
});
test('single frame', () => {
    registerCSS(`
    .my-class {
      animation-duration: 3s;
      animation-name: spin;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
`);
    const testComponent = render(React.createElement(A, { testID: "test", className: "my-class" })).getByTestId('test');
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: '0deg' }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: '180deg' }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: '360deg' }],
    });
});
test('transform - starting', () => {
    registerCSS(`
    .my-class {
      animation-duration: 3s;
      animation-name: spin;
      transform: rotate(180deg);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
`);
    const testComponent = render(React.createElement(A, { testID: "test", className: "my-class" })).getByTestId('test');
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: '180deg' }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: '270deg' }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: '360deg' }],
    });
});
test('bounce', () => {
    registerCSS(`
    .animate-bounce {
      animation: bounce 1s infinite;
      height: 100px;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8,0,1,1);
      }

      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
    }
`);
    const testComponent = render(React.createElement(A, { testID: "test", className: "animate-bounce" })).getByTestId('test');
    expect(testComponent).toHaveAnimatedStyle({
        height: 100,
        transform: [
            { translateY: -25 },
            { perspective: 1 },
            { translateX: 0 },
            { scaleX: 1 },
            { scaleY: 1 },
            { rotate: '0deg' },
            { rotateX: '0deg' },
            { rotateY: '0deg' },
            { rotateZ: '0deg' },
            { skewX: '0deg' },
            { skewY: '0deg' },
            { scale: 1 },
        ],
    });
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        height: 100,
        transform: [
            { translateY: 0 },
            { perspective: 1 },
            { translateX: 0 },
            { scaleX: 1 },
            { scaleY: 1 },
            { rotate: '0deg' },
            { rotateX: '0deg' },
            { rotateY: '0deg' },
            { rotateZ: '0deg' },
            { skewX: '0deg' },
            { skewY: '0deg' },
            { scale: 1 },
        ],
    });
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        height: 100,
        transform: [
            { translateY: -25 },
            { perspective: 1 },
            { translateX: 0 },
            { scaleX: 1 },
            { scaleY: 1 },
            { rotate: '0deg' },
            { rotateX: '0deg' },
            { rotateY: '0deg' },
            { rotateZ: '0deg' },
            { skewX: '0deg' },
            { skewY: '0deg' },
            { scale: 1 },
        ],
    });
});
//# sourceMappingURL=animations.test.js.map