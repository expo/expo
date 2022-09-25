/* eslint-env browser */

import * as React from 'react';
import { View } from 'react-native';
import { NativeSafeAreaProviderProps } from './SafeArea.types';

/**
 * TODO:
 * Currently insets and frame are based on the window and are not
 * relative to the provider view. This is inconsistent with iOS and Android.
 * However in most cases if the provider view covers the screen this is not
 * an issue.
 */

const CSSTransitions: Record<string, string> = {
  WebkitTransition: 'webkitTransitionEnd',
  Transition: 'transitionEnd',
  MozTransition: 'transitionend',
  MSTransition: 'msTransitionEnd',
  OTransition: 'oTransitionEnd',
};

export default function NativeSafeAreaView({
  children,
  style,
  onInsetsChange,
}: NativeSafeAreaProviderProps) {
  React.useEffect(() => {
    // Skip for SSR.
    if (typeof document === 'undefined') {
      return;
    }

    const element = createContextElement();
    document.body.appendChild(element);
    const onEnd = () => {
      const { paddingTop, paddingBottom, paddingLeft, paddingRight } =
        window.getComputedStyle(element);

      const insets = {
        top: paddingTop ? parseInt(paddingTop, 10) : 0,
        bottom: paddingBottom ? parseInt(paddingBottom, 10) : 0,
        left: paddingLeft ? parseInt(paddingLeft, 10) : 0,
        right: paddingRight ? parseInt(paddingRight, 10) : 0,
      };
      const frame = {
        x: 0,
        y: 0,
        width: document.documentElement.offsetWidth,
        height: document.documentElement.offsetHeight,
      };
      // @ts-ignore: missing properties
      onInsetsChange({ nativeEvent: { insets, frame } });
    };
    element.addEventListener(getSupportedTransitionEvent(), onEnd);
    onEnd();
    return () => {
      document.body.removeChild(element);
      element.removeEventListener(getSupportedTransitionEvent(), onEnd);
    };
  }, [onInsetsChange]);

  return <View style={style}>{children}</View>;
}

let _supportedTransitionEvent: string | null = null;
function getSupportedTransitionEvent(): string {
  if (_supportedTransitionEvent !== null) {
    return _supportedTransitionEvent;
  }
  const element = document.createElement('invalidtype');

  _supportedTransitionEvent = CSSTransitions.Transition;
  for (const key in CSSTransitions) {
    if (element.style[key as keyof CSSStyleDeclaration] !== undefined) {
      _supportedTransitionEvent = CSSTransitions[key];
      break;
    }
  }
  return _supportedTransitionEvent;
}

type CssEnv = 'constant' | 'env';

let _supportedEnv: CssEnv | null = null;
function getSupportedEnv(): CssEnv {
  if (_supportedEnv !== null) {
    return _supportedEnv;
  }
  const { CSS } = window;
  if (
    CSS &&
    CSS.supports &&
    CSS.supports('top: constant(safe-area-inset-top)')
  ) {
    _supportedEnv = 'constant';
  } else {
    _supportedEnv = 'env';
  }
  return _supportedEnv;
}

function getInset(side: string): string {
  return `${getSupportedEnv()}(safe-area-inset-${side})`;
}

function createContextElement(): HTMLElement {
  const element = document.createElement('div');
  const { style } = element;
  style.position = 'fixed';
  style.left = '0';
  style.top = '0';
  style.width = '0';
  style.height = '0';
  style.zIndex = '-1';
  style.overflow = 'hidden';
  style.visibility = 'hidden';
  // Bacon: Anything faster than this and the callback will be invoked too early with the wrong insets
  style.transitionDuration = '0.05s';
  style.transitionProperty = 'padding';
  style.transitionDelay = '0s';
  style.paddingTop = getInset('top');
  style.paddingBottom = getInset('bottom');
  style.paddingLeft = getInset('left');
  style.paddingRight = getInset('right');
  return element;
}
