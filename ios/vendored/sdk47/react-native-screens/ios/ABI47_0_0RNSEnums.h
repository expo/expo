typedef NS_ENUM(NSInteger, ABI47_0_0RNSScreenStackPresentation) {
  ABI47_0_0RNSScreenStackPresentationPush,
  ABI47_0_0RNSScreenStackPresentationModal,
  ABI47_0_0RNSScreenStackPresentationTransparentModal,
  ABI47_0_0RNSScreenStackPresentationContainedModal,
  ABI47_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI47_0_0RNSScreenStackPresentationFullScreenModal,
  ABI47_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSScreenStackAnimation) {
  ABI47_0_0RNSScreenStackAnimationDefault,
  ABI47_0_0RNSScreenStackAnimationNone,
  ABI47_0_0RNSScreenStackAnimationFade,
  ABI47_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI47_0_0RNSScreenStackAnimationFlip,
  ABI47_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI47_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSScreenReplaceAnimation) {
  ABI47_0_0RNSScreenReplaceAnimationPop,
  ABI47_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSScreenSwipeDirection) {
  ABI47_0_0RNSScreenSwipeDirectionHorizontal,
  ABI47_0_0RNSScreenSwipeDirectionVertical,
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSActivityState) {
  ABI47_0_0RNSActivityStateInactive = 0,
  ABI47_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI47_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSStatusBarStyle) {
  ABI47_0_0RNSStatusBarStyleAuto,
  ABI47_0_0RNSStatusBarStyleInverted,
  ABI47_0_0RNSStatusBarStyleLight,
  ABI47_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSWindowTrait) {
  ABI47_0_0RNSWindowTraitStyle,
  ABI47_0_0RNSWindowTraitAnimation,
  ABI47_0_0RNSWindowTraitHidden,
  ABI47_0_0RNSWindowTraitOrientation,
  ABI47_0_0RNSWindowTraitHomeIndicatorHidden,
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSScreenStackHeaderSubviewType) {
  ABI47_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI47_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI47_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI47_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI47_0_0RNSScreenStackHeaderSubviewTypeCenter,
  ABI47_0_0RNSScreenStackHeaderSubviewTypeSearchBar,
};
