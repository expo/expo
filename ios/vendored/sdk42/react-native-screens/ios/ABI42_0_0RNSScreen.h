#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>
#import <ABI42_0_0React/ABI42_0_0RCTComponent.h>

#import "ABI42_0_0RNSScreenContainer.h"

@class ABI42_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI42_0_0RNSScreenStackPresentation) {
  ABI42_0_0RNSScreenStackPresentationPush,
  ABI42_0_0RNSScreenStackPresentationModal,
  ABI42_0_0RNSScreenStackPresentationTransparentModal,
  ABI42_0_0RNSScreenStackPresentationContainedModal,
  ABI42_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI42_0_0RNSScreenStackPresentationFullScreenModal,
  ABI42_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI42_0_0RNSScreenStackAnimation) {
  ABI42_0_0RNSScreenStackAnimationDefault,
  ABI42_0_0RNSScreenStackAnimationNone,
  ABI42_0_0RNSScreenStackAnimationFade,
  ABI42_0_0RNSScreenStackAnimationFlip,
  ABI42_0_0RNSScreenStackAnimationSlideFromBottom,
  ABI42_0_0RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, ABI42_0_0RNSScreenReplaceAnimation) {
  ABI42_0_0RNSScreenReplaceAnimationPop,
  ABI42_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI42_0_0RNSActivityState) {
  ABI42_0_0RNSActivityStateInactive = 0,
  ABI42_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI42_0_0RNSActivityStateOnTop = 2
};

typedef NS_ENUM(NSInteger, ABI42_0_0RNSStatusBarStyle) {
  ABI42_0_0RNSStatusBarStyleAuto,
  ABI42_0_0RNSStatusBarStyleInverted,
  ABI42_0_0RNSStatusBarStyleLight,
  ABI42_0_0RNSStatusBarStyleDark,
};

typedef NS_ENUM(NSInteger, ABI42_0_0RNSWindowTrait) {
  ABI42_0_0RNSWindowTraitStyle,
  ABI42_0_0RNSWindowTraitAnimation,
  ABI42_0_0RNSWindowTraitHidden,
  ABI42_0_0RNSWindowTraitOrientation,
};

@interface ABI42_0_0RCTConvert (ABI42_0_0RNSScreen)

+ (ABI42_0_0RNSScreenStackPresentation)ABI42_0_0RNSScreenStackPresentation:(id)json;
+ (ABI42_0_0RNSScreenStackAnimation)ABI42_0_0RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (ABI42_0_0RNSStatusBarStyle)ABI42_0_0RNSStatusBarStyle:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@interface ABI42_0_0RNSScreen : UIViewController <ABI42_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI42_0_0RNSScreenManager : ABI42_0_0RCTViewManager

@end

@interface ABI42_0_0RNSScreenView : ABI42_0_0RCTView

@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onWillDisappear;
@property (weak, nonatomic) UIView<ABI42_0_0RNSScreenContainerDelegate> *ABI42_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI42_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI42_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI42_0_0RNSScreenReplaceAnimation replaceAnimation;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasStatusBarHiddenSet;

#if !TARGET_OS_TV
@property (nonatomic) ABI42_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
#endif

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI42_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
