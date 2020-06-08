#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTView.h>
#import <ABI38_0_0React/ABI38_0_0RCTComponent.h>
#import "ABI38_0_0RNSScreenContainer.h"

@class ABI38_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI38_0_0RNSScreenStackPresentation) {
  ABI38_0_0RNSScreenStackPresentationPush,
  ABI38_0_0RNSScreenStackPresentationModal,
  ABI38_0_0RNSScreenStackPresentationTransparentModal,
  ABI38_0_0RNSScreenStackPresentationContainedModal,
  ABI38_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI38_0_0RNSScreenStackPresentationFullScreenModal,
  ABI38_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI38_0_0RNSScreenStackAnimation) {
  ABI38_0_0RNSScreenStackAnimationDefault,
  ABI38_0_0RNSScreenStackAnimationNone,
  ABI38_0_0RNSScreenStackAnimationFade,
  ABI38_0_0RNSScreenStackAnimationFlip,
};

@interface ABI38_0_0RCTConvert (ABI38_0_0RNSScreen)

+ (ABI38_0_0RNSScreenStackPresentation)ABI38_0_0RNSScreenStackPresentation:(id)json;
+ (ABI38_0_0RNSScreenStackAnimation)ABI38_0_0RNSScreenStackAnimation:(id)json;

@end

@interface ABI38_0_0RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI38_0_0RNSScreenManager : ABI38_0_0RCTViewManager
@end

@interface ABI38_0_0RNSScreenView : ABI38_0_0RCTView

@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onDismissed;
@property (weak, nonatomic) UIView<ABI38_0_0RNSScreenContainerDelegate> *ABI38_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) BOOL active;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI38_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI38_0_0RNSScreenStackPresentation stackPresentation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI38_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
