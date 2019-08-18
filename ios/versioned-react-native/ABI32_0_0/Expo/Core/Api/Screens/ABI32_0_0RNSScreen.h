#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTView.h>
#import "ABI32_0_0RNSScreenContainer.h"

@class ABI32_0_0RNSScreenContainerView;

@interface ABI32_0_0RNSScreenManager : ABI32_0_0RCTViewManager
@end

@interface ABI32_0_0RNSScreenView : ABI32_0_0RCTView <ABI32_0_0RCTInvalidating>

@property (weak, nonatomic) UIView<ABI32_0_0RNSScreenContainerDelegate> *ReactABI32_0_0Superview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI32_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
