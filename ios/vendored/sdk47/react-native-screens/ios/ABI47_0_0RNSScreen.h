#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

#import "ABI47_0_0RNSEnums.h"
#import "ABI47_0_0RNSScreenContainer.h"

#if RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>
#else
#import <ABI47_0_0React/ABI47_0_0RCTView.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0RCTConvert (ABI47_0_0RNSScreen)

+ (ABI47_0_0RNSScreenStackPresentation)ABI47_0_0RNSScreenStackPresentation:(id)json;
+ (ABI47_0_0RNSScreenStackAnimation)ABI47_0_0RNSScreenStackAnimation:(id)json;

#if !TARGET_OS_TV
+ (ABI47_0_0RNSStatusBarStyle)ABI47_0_0RNSStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@class ABI47_0_0RNSScreenView;

@interface ABI47_0_0RNSScreen : UIViewController <ABI47_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (UIViewController *)findChildVCForConfigAndTrait:(ABI47_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals;
- (void)notifyFinishTransitioning;
- (ABI47_0_0RNSScreenView *)screenView;
#ifdef RN_FABRIC_ENABLED
- (void)setViewToSnapshot:(UIView *)snapshot;
- (void)resetViewToScreen;
#endif

@end

@interface ABI47_0_0RNSScreenView :
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTViewComponentView
#else
    ABI47_0_0RCTView
#endif

@property (nonatomic) BOOL fullScreenSwipeEnabled;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) BOOL hasStatusBarHiddenSet;
@property (nonatomic) BOOL hasStatusBarStyleSet;
@property (nonatomic) BOOL hasStatusBarAnimationSet;
@property (nonatomic) BOOL hasHomeIndicatorHiddenSet;
@property (nonatomic) BOOL hasOrientationSet;
@property (nonatomic) ABI47_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI47_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI47_0_0RNSScreenSwipeDirection swipeDirection;
@property (nonatomic) ABI47_0_0RNSScreenReplaceAnimation replaceAnimation;
@property (nonatomic, retain) NSNumber *transitionDuration;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) BOOL hideKeyboardOnSwipe;
@property (nonatomic) BOOL customAnimationOnSwipe;
@property (nonatomic) BOOL preventNativeDismiss;
@property (nonatomic, retain) ABI47_0_0RNSScreen *controller;
@property (nonatomic, copy) NSDictionary *gestureResponseDistance;
@property (nonatomic) int activityState;
@property (weak, nonatomic) UIView<ABI47_0_0RNSScreenContainerDelegate> *ABI47_0_0ReactSuperview;

#if !TARGET_OS_TV
@property (nonatomic) ABI47_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) BOOL homeIndicatorHidden;
#endif

#ifdef RN_FABRIC_ENABLED
// we recreate the behavior of `ABI47_0_0ReactSetFrame` on new architecture
@property (nonatomic) ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics newLayoutMetrics;
@property (weak, nonatomic) UIView *config;
#else
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onWillDisappear;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onNativeDismissCancelled;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onTransitionProgress;
#endif

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

@interface UIView (ABI47_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end

@interface ABI47_0_0RNSScreenManager : ABI47_0_0RCTViewManager

@end

NS_ASSUME_NONNULL_END
