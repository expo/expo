#import <ABI43_0_0React/ABI43_0_0RCTComponent.h>
#import <ABI43_0_0React/ABI43_0_0RCTView.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

#import "ABI43_0_0RNSScreenContainer.h"

typedef NS_ENUM(NSInteger, ABI43_0_0RNSScreenStackPresentation) {
  ABI43_0_0RNSScreenStackPresentationPush,
  ABI43_0_0RNSScreenStackPresentationModal,
  ABI43_0_0RNSScreenStackPresentationTransparentModal,
  ABI43_0_0RNSScreenStackPresentationContainedModal,
  ABI43_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI43_0_0RNSScreenStackPresentationFullScreenModal,
  ABI43_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI43_0_0RNSScreenStackAnimation) {
  ABI43_0_0RNSScreenStackAnimationDefault,
  ABI43_0_0RNSScreenStackAnimationNone,
  ABI43_0_0RNSScreenStackAnimationFade,
  ABI43_0_0RNSScreenStackAnimationFadeFromBottom,
  ABI43_0_0RNSScreenStackAnimationFlip,
  ABI43_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI43_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI43_0_0RNSScreenReplaceAnimation) {
  ABI43_0_0RNSScreenReplaceAnimationPop,
  ABI43_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI43_0_0RNSActivityState) {
  ABI43_0_0RNSActivityStateInactive = 0,
  ABI43_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI43_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI43_0_0RNSStatusBarStyle) {
  ABI43_0_0RNSStatusBarStyleAuto,
  ABI43_0_0RNSStatusBarStyleInverted,
  ABI43_0_0RNSStatusBarStyleLight,
  ABI43_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI43_0_0RNSWindowTrait) {
  ABI43_0_0RNSWindowTraitStyle,
  ABI43_0_0RNSWindowTraitAnimation,
  ABI43_0_0RNSWindowTraitHidden,
  ABI43_0_0RNSWindowTraitOrientation,
};

@interface ABI43_0_0RCTConvert (ABI43_0_0RNSScreen)

+ (ABI43_0_0RNSScreenStackPresentation)ABI43_0_0RNSScreenStackPresentation:(id)json;
+ (ABI43_0_0RNSScreenStackAnimation)ABI43_0_0RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (ABI43_0_0RNSStatusBarStyle)ABI43_0_0RNSStatusBarStyle:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@interface ABI43_0_0RNSScreen : UIViewController <ABI43_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;
- (UIViewController *)findChildVCForConfigAndTrait:(ABI43_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals;

@end

@interface ABI43_0_0RNSScreenManager : ABI43_0_0RCTViewManager

@end

@interface ABI43_0_0RNSScreenView : ABI43_0_0RCTView

@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onWillDisappear;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onNativeDismissCancelled;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onTransitionProgress;

@property (weak, nonatomic) UIView<ABI43_0_0RNSScreenContainerDelegate> *ABI43_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI43_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI43_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI43_0_0RNSScreenReplaceAnimation replaceAnimation;
@property (nonatomic) BOOL preventNativeDismiss;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasStatusBarHiddenSet;
@property (nonatomic) BOOL customAnimationOnSwipe;
@property (nonatomic) BOOL fullScreenSwipeEnabled;

#if !TARGET_OS_TV
@property (nonatomic) ABI43_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
#endif

- (void)notifyFinishTransitioning;
- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward;

@end

@interface UIView (ABI43_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
