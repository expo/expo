import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { AnimatedVisibility, EnterTransition, ExitTransition } from '..';
import { ENTER_TRANSITION_SYMBOL, EXIT_TRANSITION_SYMBOL } from '../symbols';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: jest.fn((...args) => {
    if (args[0] !== 'ExpoUI' || args[1] !== 'AnimatedVisibilityView') {
      throw new Error(`Unexpected native view requested: ${args[0]} ${args[1]}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    const MockView = (props: any) => {
      mockNativeViewFn(props);
      return createElement(View, props);
    };
    return MockView;
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
});

describe('EnterTransition', () => {
  it.each([
    'fadeIn',
    'slideInHorizontally',
    'slideInVertically',
    'expandIn',
    'expandHorizontally',
    'expandVertically',
    'scaleIn',
  ] as const)('%s() produces correct record', (method) => {
    const t = (EnterTransition[method] as Function)();
    expect(t[ENTER_TRANSITION_SYMBOL]()).toEqual([{ type: method }]);
  });

  it('fadeIn accepts initialAlpha', () => {
    const t = EnterTransition.fadeIn({ initialAlpha: 0.3 });
    expect(t[ENTER_TRANSITION_SYMBOL]()).toEqual([{ type: 'fadeIn', initialAlpha: 0.3 }]);
  });

  it('slideInHorizontally accepts initialOffsetX', () => {
    const t = EnterTransition.slideInHorizontally({ initialOffsetX: -1.0 });
    expect(t[ENTER_TRANSITION_SYMBOL]()).toEqual([
      { type: 'slideInHorizontally', initialOffsetX: -1.0 },
    ]);
  });

  it('slideInVertically accepts initialOffsetY', () => {
    const t = EnterTransition.slideInVertically({ initialOffsetY: 1.0 });
    expect(t[ENTER_TRANSITION_SYMBOL]()).toEqual([
      { type: 'slideInVertically', initialOffsetY: 1.0 },
    ]);
  });

  it('scaleIn accepts initialScale', () => {
    const t = EnterTransition.scaleIn({ initialScale: 0.5 });
    expect(t[ENTER_TRANSITION_SYMBOL]()).toEqual([{ type: 'scaleIn', initialScale: 0.5 }]);
  });
});

describe('ExitTransition', () => {
  it.each([
    'fadeOut',
    'slideOutHorizontally',
    'slideOutVertically',
    'shrinkOut',
    'shrinkHorizontally',
    'shrinkVertically',
    'scaleOut',
  ] as const)('%s() produces correct record', (method) => {
    const t = (ExitTransition[method] as Function)();
    expect(t[EXIT_TRANSITION_SYMBOL]()).toEqual([{ type: method }]);
  });

  it('fadeOut accepts targetAlpha', () => {
    const t = ExitTransition.fadeOut({ targetAlpha: 0.2 });
    expect(t[EXIT_TRANSITION_SYMBOL]()).toEqual([{ type: 'fadeOut', targetAlpha: 0.2 }]);
  });

  it('slideOutHorizontally accepts targetOffsetX', () => {
    const t = ExitTransition.slideOutHorizontally({ targetOffsetX: 1.0 });
    expect(t[EXIT_TRANSITION_SYMBOL]()).toEqual([
      { type: 'slideOutHorizontally', targetOffsetX: 1.0 },
    ]);
  });

  it('slideOutVertically accepts targetOffsetY', () => {
    const t = ExitTransition.slideOutVertically({ targetOffsetY: -1.0 });
    expect(t[EXIT_TRANSITION_SYMBOL]()).toEqual([
      { type: 'slideOutVertically', targetOffsetY: -1.0 },
    ]);
  });

  it('scaleOut accepts targetScale', () => {
    const t = ExitTransition.scaleOut({ targetScale: 0.8 });
    expect(t[EXIT_TRANSITION_SYMBOL]()).toEqual([{ type: 'scaleOut', targetScale: 0.8 }]);
  });
});

describe('plus() chaining', () => {
  it('combines two enter transitions', () => {
    const t = EnterTransition.fadeIn().plus(EnterTransition.expandIn());
    expect(t[ENTER_TRANSITION_SYMBOL]()).toEqual([{ type: 'fadeIn' }, { type: 'expandIn' }]);
  });

  it('combines three enter transitions', () => {
    const t = EnterTransition.fadeIn()
      .plus(EnterTransition.slideInHorizontally())
      .plus(EnterTransition.scaleIn());
    expect(t[ENTER_TRANSITION_SYMBOL]().map((r: any) => r.type)).toEqual([
      'fadeIn',
      'slideInHorizontally',
      'scaleIn',
    ]);
  });

  it('combines two exit transitions', () => {
    const t = ExitTransition.fadeOut().plus(ExitTransition.shrinkOut());
    expect(t[EXIT_TRANSITION_SYMBOL]()).toEqual([{ type: 'fadeOut' }, { type: 'shrinkOut' }]);
  });

  it('does not mutate the original transition', () => {
    const a = EnterTransition.fadeIn();
    a.plus(EnterTransition.expandIn());
    expect(a[ENTER_TRANSITION_SYMBOL]()).toEqual([{ type: 'fadeIn' }]);
  });
});

describe('AnimatedVisibility', () => {
  it('passes undefined transitions when not specified', () => {
    render(<AnimatedVisibility visible />);

    const props = mockNativeViewFn.mock.calls[0][0];
    expect(props.visible).toBe(true);
    expect(props.enterTransition).toBeUndefined();
    expect(props.exitTransition).toBeUndefined();
  });

  it('serializes enter and exit transitions to native props', () => {
    render(
      <AnimatedVisibility
        visible={false}
        enterTransition={EnterTransition.fadeIn({ initialAlpha: 0.5 })}
        exitTransition={ExitTransition.fadeOut()}
      />
    );

    const props = mockNativeViewFn.mock.calls[0][0];
    expect(props.enterTransition).toEqual([{ type: 'fadeIn', initialAlpha: 0.5 }]);
    expect(props.exitTransition).toEqual([{ type: 'fadeOut' }]);
  });

  it('serializes combined transitions', () => {
    render(
      <AnimatedVisibility
        visible
        enterTransition={EnterTransition.fadeIn().plus(EnterTransition.expandIn())}
        exitTransition={ExitTransition.fadeOut().plus(ExitTransition.shrinkOut())}
      />
    );

    const props = mockNativeViewFn.mock.calls[0][0];
    expect(props.enterTransition).toEqual([{ type: 'fadeIn' }, { type: 'expandIn' }]);
    expect(props.exitTransition).toEqual([{ type: 'fadeOut' }, { type: 'shrinkOut' }]);
  });

  it('passes children through to native view', () => {
    const { getByTestId } = render(
      <AnimatedVisibility visible>
        <View testID="mock-child" />
      </AnimatedVisibility>
    );
    expect(getByTestId('mock-child')).toBeTruthy();
  });
});
