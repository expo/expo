#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>
#import <ABI41_0_0React/ABI41_0_0RCTComponent.h>

#import "ABI41_0_0RNSScreenContainer.h"

@class ABI41_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI41_0_0RNSScreenStackPresentation) {
  ABI41_0_0RNSScreenStackPresentationPush,
  ABI41_0_0RNSScreenStackPresentationModal,
  ABI41_0_0RNSScreenStackPresentationTransparentModal,
  ABI41_0_0RNSScreenStackPresentationContainedModal,
  ABI41_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI41_0_0RNSScreenStackPresentationFullScreenModal,
  ABI41_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI41_0_0RNSScreenStackAnimation) {
  ABI41_0_0RNSScreenStackAnimationDefault,
  ABI41_0_0RNSScreenStackAnimationNone,
  ABI41_0_0RNSScreenStackAnimationFade,
  ABI41_0_0RNSScreenStackAnimationFlip,
};

typedef NS_ENUM(NSInteger, ABI41_0_0RNSScreenReplaceAnimation) {
  ABI41_0_0RNSScreenReplaceAnimationPop,
  ABI41_0_0RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, ABI41_0_0RNSActivityState) {
  ABI41_0_0RNSActivityStateInactive = 0,
  ABI41_0_0RNSActivityStateTransitioningOrBelowTop = 1,
  ABI41_0_0RNSActivityStateOnTop = 2
};

@interface ABI41_0_0RCTConvert (ABI41_0_0RNSScreen)

+ (ABI41_0_0RNSScreenStackPresentation)ABI41_0_0RNSScreenStackPresentation:(id)json;
+ (ABI41_0_0RNSScreenStackAnimation)ABI41_0_0RNSScreenStackAnimation:(id)json;

@end

@interface ABI41_0_0RNSScreen : UIViewController <ABI41_0_0RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI41_0_0RNSScreenManager : ABI41_0_0RCTViewManager

@end

@interface ABI41_0_0RNSScreenView : ABI41_0_0RCTView

@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onWillDisappear;
@property (weak, nonatomic) UIView<ABI41_0_0RNSScreenContainerDelegate> *ABI41_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI41_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI41_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI41_0_0RNSScreenReplaceAnimation replaceAnimation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI41_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
