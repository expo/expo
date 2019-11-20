#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>
#import "ABI34_0_0RNSScreenContainer.h"

@class ABI34_0_0RNSScreenContainerView;

@interface ABI34_0_0RNSScreenManager : ABI34_0_0RCTViewManager
@end

@interface ABI34_0_0RNSScreenView : ABI34_0_0RCTView <ABI34_0_0RCTInvalidating>

@property (weak, nonatomic) UIView<ABI34_0_0RNSScreenContainerDelegate> *ReactABI34_0_0Superview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI34_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
