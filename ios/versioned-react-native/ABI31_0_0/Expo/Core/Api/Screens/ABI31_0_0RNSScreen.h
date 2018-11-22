#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTView.h>
#import "ABI31_0_0RNSScreenContainer.h"

@class ABI31_0_0RNSScreenContainerView;

@interface ABI31_0_0RNSScreenManager : ABI31_0_0RCTViewManager
@end

@interface ABI31_0_0RNSScreenView : ABI31_0_0RCTView <ABI31_0_0RCTInvalidating>

@property (weak, nonatomic) UIView<ABI31_0_0RNSScreenContainerDelegate> *ReactABI31_0_0Superview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

@end

@interface UIView (ABI31_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
