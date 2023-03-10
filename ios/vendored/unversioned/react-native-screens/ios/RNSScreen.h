#import <React/RCTComponent.h>
#import <React/RCTViewManager.h>

#import "RNSEnums.h"
#import "RNSScreenContainer.h"

#if RN_FABRIC_ENABLED
#import <React/RCTViewComponentView.h>
#else
#import <React/RCTView.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RCTConvert (RNSScreen)

+ (RNSScreenStackPresentation)RNSScreenStackPresentation:(id)json;
+ (RNSScreenStackAnimation)RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (RNSStatusBarStyle)RNSStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@class RNSScreenView;

@interface RNSScreen : UIViewController <RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (UIViewController *)findChildVCForConfigAndTrait:(RNSWindowTrait)trait includingModals:(BOOL)includingModals;
- (void)notifyFinishTransitioning;
- (RNSScreenView *)screenView;
#ifdef RN_FABRIC_ENABLED
- (void)setViewToSnapshot:(UIView *)snapshot;
- (void)resetViewToScreen;
#endif

@end

@interface RNSScreenView :
#ifdef RN_FABRIC_ENABLED
    RCTViewComponentView
#else
    RCTView
#endif

@property (nonatomic) BOOL fullScreenSwipeEnabled;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) BOOL hasStatusBarHiddenSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasHomeIndicatorHiddenSet;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) RNSScreenStackAnimation stackAnimation;
@property (nonatomic) RNSScreenStackPresentation stackPresentation;
@property (nonatomic) RNSScreenSwipeDirection swipeDirection;
@property (nonatomic) RNSScreenReplaceAnimation replaceAnimation;

@property (nonatomic, retain) NSNumber *transitionDuration;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) BOOL hideKeyboardOnSwipe;
@property (nonatomic) BOOL customAnimationOnSwipe;
@property (nonatomic) BOOL preventNativeDismiss;
@property (nonatomic, retain) RNSScreen *controller;
@property (nonatomic, copy) NSDictionary *gestureResponseDistance;
@property (nonatomic) int activityState;
@property (weak, nonatomic) UIView<RNSScreenContainerDelegate> *reactSuperview;

#if !TARGET_OS_TV
@property (nonatomic) RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) BOOL homeIndicatorHidden;
#endif // !TARGET_OS_TV

#ifdef RN_FABRIC_ENABLED
// we recreate the behavior of `reactSetFrame` on new architecture
@property (nonatomic) facebook::react::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) facebook::react::LayoutMetrics newLayoutMetrics;
@property (weak, nonatomic) UIView *config;
#else
@property (nonatomic, copy) RCTDirectEventBlock onAppear;
@property (nonatomic, copy) RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) RCTDirectEventBlock onWillDisappear;
@property (nonatomic, copy) RCTDirectEventBlock onNativeDismissCancelled;
@property (nonatomic, copy) RCTDirectEventBlock onTransitionProgress;
#endif // RN_FABRIC_ENABLED

- (void)notifyFinishTransitioning;

#ifdef RN_FABRIC_ENABLED
- (void)notifyWillAppear;
- (void)notifyWillDisappear;
- (void)notifyAppear;
- (void)notifyDisappear;
- (void)updateBounds;
- (void)notifyDismissedWithCount:(int)dismissCount;
#endif

- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward;
- (BOOL)isModal;

@end

@interface UIView (RNSScreen)
- (UIViewController *)parentViewController;
@end

@interface RNSScreenManager : RCTViewManager

@end

NS_ASSUME_NONNULL_END
