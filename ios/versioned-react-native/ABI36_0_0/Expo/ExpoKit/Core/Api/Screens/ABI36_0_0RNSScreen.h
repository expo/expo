#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTView.h>
#import <ABI36_0_0React/ABI36_0_0RCTComponent.h>
#import "ABI36_0_0RNSScreenContainer.h"

@class ABI36_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI36_0_0RNSScreenStackPresentation) {
  ABI36_0_0RNSScreenStackPresentationPush,
  ABI36_0_0RNSScreenStackPresentationModal,
  ABI36_0_0RNSScreenStackPresentationTransparentModal,
  ABI36_0_0RNSScreenStackPresentationContainedModal,
  ABI36_0_0RNSScreenStackPresentationContainedTransparentModal
};

typedef NS_ENUM(NSInteger, ABI36_0_0RNSScreenStackAnimation) {
  ABI36_0_0RNSScreenStackAnimationDefault,
  ABI36_0_0RNSScreenStackAnimationNone,
  ABI36_0_0RNSScreenStackAnimationFade,
  ABI36_0_0RNSScreenStackAnimationFlip,
};

@interface ABI36_0_0RCTConvert (ABI36_0_0RNSScreen)

+ (ABI36_0_0RNSScreenStackPresentation)ABI36_0_0RNSScreenStackPresentation:(id)json;
+ (ABI36_0_0RNSScreenStackAnimation)ABI36_0_0RNSScreenStackAnimation:(id)json;

@end

@interface ABI36_0_0RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI36_0_0RNSScreenManager : ABI36_0_0RCTViewManager
@end

@interface ABI36_0_0RNSScreenView : ABI36_0_0RCTView

@property (nonatomic, copy) ABI36_0_0RCTDirectEventBlock onDismissed;
@property (weak, nonatomic) UIView<ABI36_0_0RNSScreenContainerDelegate> *ABI36_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;
@property (nonatomic) ABI36_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI36_0_0RNSScreenStackPresentation stackPresentation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI36_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
