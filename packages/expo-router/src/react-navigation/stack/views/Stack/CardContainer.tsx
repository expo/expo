import * as React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Card } from './Card';
import { CardA11yWrapper, type CardA11yWrapperRef } from './CardA11yWrapper';
import {
  getHeaderTitle,
  HeaderBackContext,
  HeaderHeightContext,
  HeaderShownContext,
} from '../../../elements';
import { type Route, useLinkBuilder, useLocale, useTheme } from '../../../native';
import type { Layout, Scene } from '../../types';
import { ModalPresentationContext } from '../../utils/ModalPresentationContext';
import { useKeyboardManager } from '../../utils/useKeyboardManager';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';

type Props = {
  interpolationIndex: number;
  index: number;
  active: boolean;
  focused: boolean;
  opening: boolean;
  closing: boolean;
  modal: boolean;
  layout: Layout;
  gesture: Animated.Value;
  preloaded: boolean;
  scene: Scene;
  safeAreaInsetTop: number;
  safeAreaInsetRight: number;
  safeAreaInsetBottom: number;
  safeAreaInsetLeft: number;
  getPreviousScene: (props: { route: Route<string> }) => Scene | undefined;
  getFocusedRoute: () => Route<string>;
  renderHeader: (props: HeaderContainerProps) => React.ReactNode;
  onOpenRoute: (props: { route: Route<string> }) => void;
  onCloseRoute: (props: { route: Route<string> }) => void;
  onTransitionStart: (props: { route: Route<string> }, closing: boolean) => void;
  onTransitionEnd: (props: { route: Route<string> }, closing: boolean) => void;
  onGestureStart: (props: { route: Route<string> }) => void;
  onGestureEnd: (props: { route: Route<string> }) => void;
  onGestureCancel: (props: { route: Route<string> }) => void;
  hasAbsoluteFloatHeader: boolean;
  headerHeight: number;
  onHeaderHeightChange: (props: { route: Route<string>; height: number }) => void;
  isParentHeaderShown: boolean;
  isNextScreenTransparent: boolean;
  detachCurrentScreen: boolean;
};

const EPSILON = 0.1;

function CardContainerInner({
  interpolationIndex,
  index,
  active,
  opening,
  closing,
  gesture,
  focused,
  modal,
  getPreviousScene,
  getFocusedRoute,
  hasAbsoluteFloatHeader,
  headerHeight,
  onHeaderHeightChange,
  isParentHeaderShown,
  isNextScreenTransparent,
  detachCurrentScreen,
  layout,
  onCloseRoute,
  onOpenRoute,
  onGestureCancel,
  onGestureEnd,
  onGestureStart,
  onTransitionEnd,
  onTransitionStart,
  preloaded,
  renderHeader,
  safeAreaInsetBottom,
  safeAreaInsetLeft,
  safeAreaInsetRight,
  safeAreaInsetTop,
  scene,
}: Props) {
  const wrapperRef = React.useRef<CardA11yWrapperRef>(null);

  const { direction } = useLocale();

  const parentHeaderHeight = React.useContext(HeaderHeightContext);

  const { options } = scene.descriptor;
  const enabled = focused && options.keyboardHandlingEnabled !== false;

  const { onPageChangeStart, onPageChangeCancel, onPageChangeConfirm } = useKeyboardManager({
    enabled,
    focused,
  });

  const handleOpen = () => {
    const { route } = scene.descriptor;

    onTransitionEnd({ route }, false);
    onOpenRoute({ route });
  };

  const handleClose = () => {
    const { route } = scene.descriptor;

    onTransitionEnd({ route }, true);
    onCloseRoute({ route });
  };

  const handleGestureBegin = () => {
    const { route } = scene.descriptor;

    onPageChangeStart();
    onGestureStart({ route });
  };

  const handleGestureCanceled = () => {
    const { route } = scene.descriptor;

    onPageChangeCancel();
    onGestureCancel({ route });
  };

  const handleGestureEnd = () => {
    const { route } = scene.descriptor;

    onGestureEnd({ route });
  };

  const handleTransition = ({ closing, gesture }: { closing: boolean; gesture: boolean }) => {
    wrapperRef.current?.setInert(closing);

    const { route } = scene.descriptor;

    onPageChangeConfirm?.({ gesture, active, closing });

    onTransitionStart?.({ route }, closing);
  };

  const insets = {
    top: safeAreaInsetTop,
    right: safeAreaInsetRight,
    bottom: safeAreaInsetBottom,
    left: safeAreaInsetLeft,
  };

  const { colors } = useTheme();

  React.useEffect(() => {
    const listener = scene.progress.next?.addListener?.(({ value }: { value: number }) => {
      wrapperRef.current?.setInert(value > EPSILON);
    });

    return () => {
      if (listener) {
        scene.progress.next?.removeListener?.(listener);
      }
    };
  }, [scene.progress.next]);

  const {
    presentation,
    animation,
    cardOverlay,
    cardOverlayEnabled,
    cardShadowEnabled,
    cardStyle,
    cardStyleInterpolator,
    gestureDirection,
    gestureEnabled,
    gestureResponseDistance,
    gestureVelocityImpact,
    headerMode,
    headerShown,
    transitionSpec,
  } = scene.descriptor.options;

  const { buildHref } = useLinkBuilder();
  const previousScene = getPreviousScene({ route: scene.descriptor.route });

  let backTitle: string | undefined;
  let href: string | undefined;

  if (previousScene) {
    const { options, route } = previousScene.descriptor;

    backTitle = getHeaderTitle(options, route.name);
    href = buildHref(route.name, route.params);
  }

  const canGoBack = previousScene != null;
  const headerBack = React.useMemo(() => {
    if (canGoBack) {
      return {
        href,
        title: backTitle,
      };
    }

    return undefined;
  }, [canGoBack, backTitle, href]);

  const animated = animation !== 'none';

  return (
    <CardA11yWrapper
      ref={wrapperRef}
      focused={focused}
      active={active}
      animated={animated}
      isNextScreenTransparent={isNextScreenTransparent}
      detachCurrentScreen={detachCurrentScreen}>
      <Card
        animated={animated}
        interpolationIndex={interpolationIndex}
        gestureDirection={gestureDirection}
        layout={layout}
        insets={insets}
        direction={direction}
        gesture={gesture}
        current={scene.progress.current}
        next={scene.progress.next}
        opening={opening}
        closing={closing}
        onOpen={handleOpen}
        onClose={handleClose}
        overlay={cardOverlay}
        overlayEnabled={cardOverlayEnabled}
        shadowEnabled={cardShadowEnabled}
        onTransition={handleTransition}
        onGestureBegin={handleGestureBegin}
        onGestureCanceled={handleGestureCanceled}
        onGestureEnd={handleGestureEnd}
        gestureEnabled={index === 0 ? false : gestureEnabled}
        gestureResponseDistance={gestureResponseDistance}
        gestureVelocityImpact={gestureVelocityImpact}
        transitionSpec={transitionSpec}
        styleInterpolator={cardStyleInterpolator}
        pageOverflowEnabled={headerMode !== 'float' && presentation !== 'modal'}
        preloaded={preloaded}
        containerStyle={
          hasAbsoluteFloatHeader && headerMode !== 'screen' ? { marginTop: headerHeight } : null
        }
        contentStyle={[
          {
            backgroundColor:
              presentation === 'transparentModal' ? 'transparent' : colors.background,
          },
          cardStyle,
        ]}>
        <View style={styles.container}>
          <ModalPresentationContext.Provider value={modal}>
            {headerMode !== 'float'
              ? renderHeader({
                  mode: 'screen',
                  layout,
                  scenes: [previousScene, scene],
                  getPreviousScene,
                  getFocusedRoute,
                  onContentHeightChange: onHeaderHeightChange,
                  style: styles.header,
                })
              : null}
            <View style={styles.scene}>
              <HeaderBackContext.Provider value={headerBack}>
                <HeaderShownContext.Provider value={isParentHeaderShown || headerShown !== false}>
                  <HeaderHeightContext.Provider
                    value={headerShown !== false ? headerHeight : (parentHeaderHeight ?? 0)}>
                    {scene.descriptor.render()}
                  </HeaderHeightContext.Provider>
                </HeaderShownContext.Provider>
              </HeaderBackContext.Provider>
            </View>
          </ModalPresentationContext.Provider>
        </View>
      </Card>
    </CardA11yWrapper>
  );
}

export const CardContainer = React.memo(CardContainerInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 1,
  },
  scene: {
    flex: 1,
  },
});
