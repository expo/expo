#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTView.h>
#import <ABI40_0_0React/ABI40_0_0RCTComponent.h>

#import "ABI40_0_0RNSScreenContainer.h"

@class ABI40_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI40_0_0RNSScreenStackPresentation) {
  ABI40_0_0RNSScreenStackPresentationPush,
  ABI40_0_0RNSScreenStackPresentationModal,
  ABI40_0_0RNSScreenStackPresentationTransparentModal,
  ABI40_0_0RNSScreenStackPresentationContainedModal,
  ABI40_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI40_0_0RNSScreenStackPresentationFullScreenModal,
  ABI40_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI40_0_0RNSScreenStackAnimation) {
  ABI40_0_0RNSScreenStackAnimationDefault,
  ABI40_0_0RNSScreenStackAnimationNone,
  ABI40_0_0RNSScreenStackAnimationFade,
  ABI40_0_0RNSScreenStackAnimationFlip,
};

typedef NS_ENUM(NSInteger, ABI40_0_0RNSScreenReplaceAnimation) {
  ABI40_0_0RNSScreenReplaceAnimationPop,
  ABI40_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI40_0_0RNSActivityState) {
  ABI40_0_0RNSActivityStateInactive = 0,
  ABI40_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI40_0_0RNSActivityStateOnTop = 2
};

@interface ABI40_0_0RCTConvert (ABI40_0_0RNSScreen)

+ (ABI40_0_0RNSScreenStackPresentation)ABI40_0_0RNSScreenStackPresentation:(id)json;
+ (ABI40_0_0RNSScreenStackAnimation)ABI40_0_0RNSScreenStackAnimation:(id)json;

@end

@interface ABI40_0_0RNSScreen : UIViewController <ABI40_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI40_0_0RNSScreenManager : ABI40_0_0RCTViewManager

@end

@interface ABI40_0_0RNSScreenView : ABI40_0_0RCTView

@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onWillDisappear;
@property (weak, nonatomic) UIView<ABI40_0_0RNSScreenContainerDelegate> *ABI40_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI40_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI40_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI40_0_0RNSScreenReplaceAnimation replaceAnimation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI40_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
