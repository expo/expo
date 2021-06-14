#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import <React/RCTComponent.h>

#import "RNSScreenContainer.h"

@class RNSScreenContainerView;

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
  RNSScreenStackAnimationFlip,
  RNSScreenStackAnimationSlideFromBottom,
  RNSScreenStackAnimationSimplePush,
};

typedef NS_ENUM(NSInteger, RNSScreenReplaceAnimation) {
  RNSScreenReplaceAnimationPop,
  RNSScreenReplaceAnimationPush,
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
};

@interface RCTConvert (RNSScreen)

+ (RNSScreenStackPresentation)RNSScreenStackPresentation:(id)json;
+ (RNSScreenStackAnimation)RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (RNSStatusBarStyle)RNSStatusBarStyle:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@interface RNSScreen : UIViewController <RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface RNSScreenManager : RCTViewManager

@end

@interface RNSScreenView : RCTView

@property (nonatomic, copy) RCTDirectEventBlock onAppear;
@property (nonatomic, copy) RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) RCTDirectEventBlock onWillDisappear;
@property (weak, nonatomic) UIView<RNSScreenContainerDelegate> *reactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) RNSScreenStackAnimation stackAnimation;
@property (nonatomic) RNSScreenStackPresentation stackPresentation;
@property (nonatomic) RNSScreenReplaceAnimation replaceAnimation;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasStatusBarHiddenSet;

#if !TARGET_OS_TV
@property (nonatomic) RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
#endif

- (void)notifyFinishTransitioning;

@end

@interface UIView (RNSScreen)
- (UIViewController *)parentViewController;
@end
