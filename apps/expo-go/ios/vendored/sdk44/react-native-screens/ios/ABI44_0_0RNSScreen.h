#import <ABI44_0_0React/ABI44_0_0RCTComponent.h>
#import <ABI44_0_0React/ABI44_0_0RCTView.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

#import "ABI44_0_0RNSScreenContainer.h"

typedef NS_ENUM(NSInteger, ABI44_0_0RNSScreenStackPresentation) {
  ABI44_0_0RNSScreenStackPresentationPush,
  ABI44_0_0RNSScreenStackPresentationModal,
  ABI44_0_0RNSScreenStackPresentationTransparentModal,
  ABI44_0_0RNSScreenStackPresentationContainedModal,
  ABI44_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI44_0_0RNSScreenStackPresentationFullScreenModal,
  ABI44_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI44_0_0RNSScreenStackAnimation) {
  ABI44_0_0RNSScreenStackAnimationDefault,
  ABI44_0_0RNSScreenStackAnimationNone,
  ABI44_0_0RNSScreenStackAnimationFade,
  ABI44_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI44_0_0RNSScreenStackAnimationFlip,
  ABI44_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI44_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI44_0_0RNSScreenReplaceAnimation) {
  ABI44_0_0RNSScreenReplaceAnimationPop,
  ABI44_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI44_0_0RNSActivityState) {
  ABI44_0_0RNSActivityStateInactive = 0,
  ABI44_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI44_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI44_0_0RNSStatusBarStyle) {
  ABI44_0_0RNSStatusBarStyleAuto,
  ABI44_0_0RNSStatusBarStyleInverted,
  ABI44_0_0RNSStatusBarStyleLight,
  ABI44_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI44_0_0RNSWindowTrait) {
  ABI44_0_0RNSWindowTraitStyle,
  ABI44_0_0RNSWindowTraitAnimation,
  ABI44_0_0RNSWindowTraitHidden,
  ABI44_0_0RNSWindowTraitOrientation,
};

@interface ABI44_0_0RCTConvert (ABI44_0_0RNSScreen)

+ (ABI44_0_0RNSScreenStackPresentation)ABI44_0_0RNSScreenStackPresentation:(id)json;
+ (ABI44_0_0RNSScreenStackAnimation)ABI44_0_0RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (ABI44_0_0RNSStatusBarStyle)ABI44_0_0RNSStatusBarStyle:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@interface ABI44_0_0RNSScreen : UIViewController <ABI44_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;
- (UIViewController *)findChildVCForConfigAndTrait:(ABI44_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals;

@end

@interface ABI44_0_0RNSScreenManager : ABI44_0_0RCTViewManager

@end

@interface ABI44_0_0RNSScreenView : ABI44_0_0RCTView

@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onWillDisappear;
@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onNativeDismissCancelled;
@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onTransitionProgress;

@property (weak, nonatomic) UIView<ABI44_0_0RNSScreenContainerDelegate> *ABI44_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI44_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI44_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI44_0_0RNSScreenReplaceAnimation replaceAnimation;
@property (nonatomic) BOOL preventNativeDismiss;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasStatusBarHiddenSet;
@property (nonatomic) BOOL customAnimationOnSwipe;
@property (nonatomic) BOOL fullScreenSwipeEnabled;

#if !TARGET_OS_TV
@property (nonatomic) ABI44_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
#endif

- (void)notifyFinishTransitioning;
- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward;

@end

@interface UIView (ABI44_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
