typedef NS_ENUM(NSInteger, ABI46_0_0RNSScreenStackPresentation) {
  ABI46_0_0RNSScreenStackPresentationPush,
  ABI46_0_0RNSScreenStackPresentationModal,
  ABI46_0_0RNSScreenStackPresentationTransparentModal,
  ABI46_0_0RNSScreenStackPresentationContainedModal,
  ABI46_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI46_0_0RNSScreenStackPresentationFullScreenModal,
  ABI46_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSScreenStackAnimation) {
  ABI46_0_0RNSScreenStackAnimationDefault,
  ABI46_0_0RNSScreenStackAnimationNone,
  ABI46_0_0RNSScreenStackAnimationFade,
  ABI46_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI46_0_0RNSScreenStackAnimationFlip,
  ABI46_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI46_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSScreenReplaceAnimation) {
  ABI46_0_0RNSScreenReplaceAnimationPop,
  ABI46_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSScreenSwipeDirection) {
  ABI46_0_0RNSScreenSwipeDirectionHorizontal,
  ABI46_0_0RNSScreenSwipeDirectionVertical,
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSActivityState) {
  ABI46_0_0RNSActivityStateInactive = 0,
  ABI46_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI46_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSStatusBarStyle) {
  ABI46_0_0RNSStatusBarStyleAuto,
  ABI46_0_0RNSStatusBarStyleInverted,
  ABI46_0_0RNSStatusBarStyleLight,
  ABI46_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSWindowTrait) {
  ABI46_0_0RNSWindowTraitStyle,
  ABI46_0_0RNSWindowTraitAnimation,
  ABI46_0_0RNSWindowTraitHidden,
  ABI46_0_0RNSWindowTraitOrientation,
  ABI46_0_0RNSWindowTraitHomeIndicatorHidden,
};

typedef NS_ENUM(NSInteger, ABI46_0_0RNSScreenStackHeaderSubviewType) {
  ABI46_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI46_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI46_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI46_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI46_0_0RNSScreenStackHeaderSubviewTypeCenter,
  ABI46_0_0RNSScreenStackHeaderSubviewTypeSearchBar,
};
