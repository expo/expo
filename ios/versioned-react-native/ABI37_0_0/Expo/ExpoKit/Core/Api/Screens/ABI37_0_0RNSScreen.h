#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTView.h>
#import <ABI37_0_0React/ABI37_0_0RCTComponent.h>
#import "ABI37_0_0RNSScreenContainer.h"

@class ABI37_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI37_0_0RNSScreenStackPresentation) {
  ABI37_0_0RNSScreenStackPresentationPush,
  ABI37_0_0RNSScreenStackPresentationModal,
  ABI37_0_0RNSScreenStackPresentationTransparentModal,
  ABI37_0_0RNSScreenStackPresentationContainedModal,
  ABI37_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI37_0_0RNSScreenStackPresentationFullScreenModal,
  ABI37_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI37_0_0RNSScreenStackAnimation) {
  ABI37_0_0RNSScreenStackAnimationDefault,
  ABI37_0_0RNSScreenStackAnimationNone,
  ABI37_0_0RNSScreenStackAnimationFade,
  ABI37_0_0RNSScreenStackAnimationFlip,
};

@interface ABI37_0_0RCTConvert (ABI37_0_0RNSScreen)

+ (ABI37_0_0RNSScreenStackPresentation)ABI37_0_0RNSScreenStackPresentation:(id)json;
+ (ABI37_0_0RNSScreenStackAnimation)ABI37_0_0RNSScreenStackAnimation:(id)json;

@end

@interface ABI37_0_0RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI37_0_0RNSScreenManager : ABI37_0_0RCTViewManager
@end

@interface ABI37_0_0RNSScreenView : ABI37_0_0RCTView

@property (nonatomic, copy) ABI37_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI37_0_0RCTDirectEventBlock onDismissed;
@property (weak, nonatomic) UIView<ABI37_0_0RNSScreenContainerDelegate> *ABI37_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI37_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI37_0_0RNSScreenStackPresentation stackPresentation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI37_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
