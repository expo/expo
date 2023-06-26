typedef NS_ENUM(NSInteger, ABI49_0_0RNSScreenStackPresentation) {
  ABI49_0_0RNSScreenStackPresentationPush,
  ABI49_0_0RNSScreenStackPresentationModal,
  ABI49_0_0RNSScreenStackPresentationTransparentModal,
  ABI49_0_0RNSScreenStackPresentationContainedModal,
  ABI49_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI49_0_0RNSScreenStackPresentationFullScreenModal,
  ABI49_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSScreenStackAnimation) {
  ABI49_0_0RNSScreenStackAnimationDefault,
  ABI49_0_0RNSScreenStackAnimationNone,
  ABI49_0_0RNSScreenStackAnimationFade,
  ABI49_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI49_0_0RNSScreenStackAnimationFlip,
  ABI49_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI49_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSScreenReplaceAnimation) {
  ABI49_0_0RNSScreenReplaceAnimationPop,
  ABI49_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSScreenSwipeDirection) {
  ABI49_0_0RNSScreenSwipeDirectionHorizontal,
  ABI49_0_0RNSScreenSwipeDirectionVertical,
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSActivityState) {
  ABI49_0_0RNSActivityStateInactive = 0,
  ABI49_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI49_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSStatusBarStyle) {
  ABI49_0_0RNSStatusBarStyleAuto,
  ABI49_0_0RNSStatusBarStyleInverted,
  ABI49_0_0RNSStatusBarStyleLight,
  ABI49_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSWindowTrait) {
  ABI49_0_0RNSWindowTraitStyle,
  ABI49_0_0RNSWindowTraitAnimation,
  ABI49_0_0RNSWindowTraitHidden,
  ABI49_0_0RNSWindowTraitOrientation,
  ABI49_0_0RNSWindowTraitHomeIndicatorHidden,
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSScreenStackHeaderSubviewType) {
  ABI49_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI49_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI49_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI49_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI49_0_0RNSScreenStackHeaderSubviewTypeCenter,
  ABI49_0_0RNSScreenStackHeaderSubviewTypeSearchBar,
};

typedef NS_ENUM(NSInteger, ABI49_0_0RNSScreenDetentType) {
  ABI49_0_0RNSScreenDetentTypeMedium,
  ABI49_0_0RNSScreenDetentTypeLarge,
  ABI49_0_0RNSScreenDetentTypeAll,
};
