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
};

typedef NS_ENUM(NSInteger, RNSScreenReplaceAnimation) {
  RNSScreenReplaceAnimationPop,
  RNSScreenReplaceAnimationPush,
};

@interface RCTConvert (RNSScreen)

+ (RNSScreenStackPresentation)RNSScreenStackPresentation:(id)json;
+ (RNSScreenStackAnimation)RNSScreenStackAnimation:(id)json;

@end

@interface RNSScreen : UIViewController

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
@property (nonatomic) BOOL active;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) RNSScreenStackAnimation stackAnimation;
@property (nonatomic) RNSScreenStackPresentation stackPresentation;
@property (nonatomic) RNSScreenReplaceAnimation replaceAnimation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (RNSScreen)
- (UIViewController *)parentViewController;
@end
