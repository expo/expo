#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0RCTView.h>
#import <ABI39_0_0React/ABI39_0_0RCTComponent.h>
#import "ABI39_0_0RNSScreenContainer.h"

@class ABI39_0_0RNSScreenContainerView;

typedef NS_ENUM(NSInteger, ABI39_0_0RNSScreenStackPresentation) {
  ABI39_0_0RNSScreenStackPresentationPush,
  ABI39_0_0RNSScreenStackPresentationModal,
  ABI39_0_0RNSScreenStackPresentationTransparentModal,
  ABI39_0_0RNSScreenStackPresentationContainedModal,
  ABI39_0_0RNSScreenStackPresentationContainedTransparentModal,
  ABI39_0_0RNSScreenStackPresentationFullScreenModal,
  ABI39_0_0RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, ABI39_0_0RNSScreenStackAnimation) {
  ABI39_0_0RNSScreenStackAnimationDefault,
  ABI39_0_0RNSScreenStackAnimationNone,
  ABI39_0_0RNSScreenStackAnimationFade,
  ABI39_0_0RNSScreenStackAnimationFlip,
};

typedef NS_ENUM(NSInteger, ABI39_0_0RNSScreenReplaceAnimation) {
  ABI39_0_0RNSScreenReplaceAnimationPop,
  ABI39_0_0RNSScreenReplaceAnimationPush,
};

@interface ABI39_0_0RCTConvert (ABI39_0_0RNSScreen)

+ (ABI39_0_0RNSScreenStackPresentation)ABI39_0_0RNSScreenStackPresentation:(id)json;
+ (ABI39_0_0RNSScreenStackAnimation)ABI39_0_0RNSScreenStackAnimation:(id)json;

@end

@interface ABI39_0_0RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface ABI39_0_0RNSScreenManager : ABI39_0_0RCTViewManager
@end

@interface ABI39_0_0RNSScreenView : ABI39_0_0RCTView

@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onWillDisappear;
@property (weak, nonatomic) UIView<ABI39_0_0RNSScreenContainerDelegate> *ABI39_0_0ReactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) BOOL active;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) ABI39_0_0RNSScreenStackAnimation stackAnimation;
@property (nonatomic) ABI39_0_0RNSScreenStackPresentation stackPresentation;
@property (nonatomic) ABI39_0_0RNSScreenReplaceAnimation replaceAnimation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI39_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
