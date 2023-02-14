typedef NS_ENUM(NSInteger, ABI48_0_0RNSScreenStackPresentation) {
  ABI48_0_0RNSScreenStackPresentationPush,
  ABI48_0_0RNSScreenStackPresentationModal,
  ABI48_0_0RNSScreenStackPresentationTransparentModal,
  ABI48_0_0RNSScreenStackPresentationContainedModal,
  ABI48_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI48_0_0RNSScreenStackPresentationFullScreenModal,
  ABI48_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSScreenStackAnimation) {
  ABI48_0_0RNSScreenStackAnimationDefault,
  ABI48_0_0RNSScreenStackAnimationNone,
  ABI48_0_0RNSScreenStackAnimationFade,
  ABI48_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI48_0_0RNSScreenStackAnimationFlip,
  ABI48_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI48_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSScreenReplaceAnimation) {
  ABI48_0_0RNSScreenReplaceAnimationPop,
  ABI48_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSScreenSwipeDirection) {
  ABI48_0_0RNSScreenSwipeDirectionHorizontal,
  ABI48_0_0RNSScreenSwipeDirectionVertical,
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSActivityState) {
  ABI48_0_0RNSActivityStateInactive = 0,
  ABI48_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI48_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSStatusBarStyle) {
  ABI48_0_0RNSStatusBarStyleAuto,
  ABI48_0_0RNSStatusBarStyleInverted,
  ABI48_0_0RNSStatusBarStyleLight,
  ABI48_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSWindowTrait) {
  ABI48_0_0RNSWindowTraitStyle,
  ABI48_0_0RNSWindowTraitAnimation,
  ABI48_0_0RNSWindowTraitHidden,
  ABI48_0_0RNSWindowTraitOrientation,
  ABI48_0_0RNSWindowTraitHomeIndicatorHidden,
};

typedef NS_ENUM(NSInteger, ABI48_0_0RNSScreenStackHeaderSubviewType) {
  ABI48_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI48_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI48_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI48_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI48_0_0RNSScreenStackHeaderSubviewTypeCenter,
  ABI48_0_0RNSScreenStackHeaderSubviewTypeSearchBar,
};
