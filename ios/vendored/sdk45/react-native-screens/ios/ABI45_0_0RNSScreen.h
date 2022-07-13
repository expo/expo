#import <ABI45_0_0React/ABI45_0_0RCTComponent.h>
#import <ABI45_0_0React/ABI45_0_0RCTView.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>

#import "ABI45_0_0RNSScreenContainer.h"

typedef NS_ENUM(NSInteger, ABI45_0_0RNSScreenStackPresentation) {
  ABI45_0_0RNSScreenStackPresentationPush,
  ABI45_0_0RNSScreenStackPresentationModal,
  ABI45_0_0RNSScreenStackPresentationTransparentModal,
  ABI45_0_0RNSScreenStackPresentationContainedModal,
  ABI45_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI45_0_0RNSScreenStackPresentationFullScreenModal,
  ABI45_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI45_0_0RNSScreenStackAnimation) {
  ABI45_0_0RNSScreenStackAnimationDefault,
  ABI45_0_0RNSScreenStackAnimationNone,
  ABI45_0_0RNSScreenStackAnimationFade,
  ABI45_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI45_0_0RNSScreenStackAnimationFlip,
  ABI45_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI45_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI45_0_0RNSScreenReplaceAnimation) {
  ABI45_0_0RNSScreenReplaceAnimationPop,
  ABI45_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI45_0_0RNSScreenSwipeDirection) {
  ABI45_0_0RNSScreenSwipeDirectionHorizontal,
  ABI45_0_0RNSScreenSwipeDirectionVertical,
};

typedef NS_ENUM(NSInteger, ABI45_0_0RNSActivityState) {
  ABI45_0_0RNSActivityStateInactive = 0,
  ABI45_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI45_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI45_0_0RNSStatusBarStyle) {
  ABI45_0_0RNSStatusBarStyleAuto,
  ABI45_0_0RNSStatusBarStyleInverted,
  ABI45_0_0RNSStatusBarStyleLight,
  ABI45_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI45_0_0RNSWindowTrait) {
  ABI45_0_0RNSWindowTraitStyle,
  ABI45_0_0RNSWindowTraitAnimation,
  ABI45_0_0RNSWindowTraitHidden,
  ABI45_0_0RNSWindowTraitOrientation,
  ABI45_0_0RNSWindowTraitHomeIndicatorHidden,
};

@interface ABI45_0_0RCTConvert (ABI45_0_0RNSScreen)

+ (ABI45_0_0RNSScreenStackPresentation)ABI45_0_0RNSScreenStackPresentation:(id)json;
+ (ABI45_0_0RNSScreenStackAnimation)ABI45_0_0RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (ABI45_0_0RNSStatusBarStyle)ABI45_0_0RNSStatusBarStyle:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@interface ABI45_0_0RNSScreen : UIViewController <ABI45_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;
- (UIViewController *)findChildVCForConfigAndTrait:(ABI45_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals;

@end

@interface ABI45_0_0RNSScreenManager : ABI45_0_0RCTViewManager

@end

@interface ABI45_0_0RNSScreenView : ABI45_0_0RCTView

@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onWillDisappear;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onNativeDismissCancelled;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onTransitionProgress;

@property (weak, nonatomic) UIView<ABI45_0_0RNSScreenContainerDelegate> *ABI45_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI45_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI45_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI45_0_0RNSScreenReplaceAnimation replaceAnimation;
@property (nonatomic) ABI45_0_0RNSScreenSwipeDirection swipeDirection;
@property (nonatomic) BOOL preventNativeDismiss;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasStatusBarHiddenSet;
@property (nonatomic) BOOL hasHomeIndicatorHiddenSet;
@property (nonatomic) BOOL customAnimationOnSwipe;
@property (nonatomic) BOOL fullScreenSwipeEnabled;
@property (nonatomic, retain) NSNumber *transitionDuration;

#if !TARGET_OS_TV
@property (nonatomic) ABI45_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
@property (nonatomic) BOOL homeIndicatorHidden;
#endif

- (void)notifyFinishTransitioning;
- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward;

@end

@interface UIView (ABI45_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
