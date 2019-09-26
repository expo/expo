#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>
#import "ABI35_0_0RNSScreenContainer.h"

@class ABI35_0_0RNSScreenContainerView;

@interface ABI35_0_0RNSScreenManager : ABI35_0_0RCTViewManager
@end

@interface ABI35_0_0RNSScreenView : ABI35_0_0RCTView <ABI35_0_0RCTInvalidating>

@property (weak, nonatomic) UIView<ABI35_0_0RNSScreenContainerDelegate> *ReactABI35_0_0Superview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

- (void)notifyFinishTransitioning;

@end

@interface UIView (ABI35_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
