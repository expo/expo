typedef NS_ENUM(NSInteger, RNSScreenStackPresentation) {
  RNSScreenStackPresentationPush,
  RNSScreenStackPresentationModal,
  RNSScreenStackPresentationTransparentModal,
  RNSScreenStackPresentationContainedModal,
  RNSScreenStackPresentationContainedTransparentModal,
  RNSScreenStackPresentationFullScreenModal,
  RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, RNSScreenStackAnimation) {
  RNSScreenStackAnimationDefault,
  RNSScreenStackAnimationNone,
  RNSScreenStackAnimationFade,
  RNSScreenStackAnimationFadeFromBottom,
  RNSScreenStackAnimationFlip,
  RNSScreenStackAnimationSlideFromBottom,
  RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, RNSScreenReplaceAnimation) {
  RNSScreenReplaceAnimationPop,
  RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, RNSScreenSwipeDirection) {
  RNSScreenSwipeDirectionHorizontal,
  RNSScreenSwipeDirectionVertical,
};

typedef NS_ENUM(NSInteger, RNSActivityState) {
  RNSActivityStateInactive = 0,
  RNSActivityStateTransitioningOrBelowTop = 1,
  RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, RNSStatusBarStyle) {
  RNSStatusBarStyleAuto,
  RNSStatusBarStyleInverted,
  RNSStatusBarStyleLight,
  RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, RNSWindowTrait) {
  RNSWindowTraitStyle,
  RNSWindowTraitAnimation,
  RNSWindowTraitHidden,
  RNSWindowTraitOrientation,
  RNSWindowTraitHomeIndicatorHidden,
};

typedef NS_ENUM(NSInteger, RNSScreenStackHeaderSubviewType) {
  RNSScreenStackHeaderSubviewTypeBackButton,
  RNSScreenStackHeaderSubviewTypeLeft,
  RNSScreenStackHeaderSubviewTypeRight,
  RNSScreenStackHeaderSubviewTypeTitle,
  RNSScreenStackHeaderSubviewTypeCenter,
  RNSScreenStackHeaderSubviewTypeSearchBar,
};
