#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>
#import "ABI33_0_0RNSScreenContainer.h"

@class ABI33_0_0RNSScreenContainerView;

@interface ABI33_0_0RNSScreenManager : ABI33_0_0RCTViewManager
@end

@interface ABI33_0_0RNSScreenView : ABI33_0_0RCTView <ABI33_0_0RCTInvalidating>

@property (weak, nonatomic) UIView<ABI33_0_0RNSScreenContainerDelegate> *ReactABI33_0_0Superview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI33_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
