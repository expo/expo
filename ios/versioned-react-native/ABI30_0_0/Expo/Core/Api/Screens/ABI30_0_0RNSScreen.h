#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTView.h>
#import "ABI30_0_0RNSScreenContainer.h"

@class ABI30_0_0RNSScreenContainerView;

@interface ABI30_0_0RNSScreenManager : ABI30_0_0RCTViewManager
@end

@interface ABI30_0_0RNSScreenView : ABI30_0_0RCTView <ABI30_0_0RCTInvalidating>

@property (weak, nonatomic) UIView<ABI30_0_0RNSScreenContainerDelegate> *ReactABI30_0_0Superview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

@end

@interface UIView (ABI30_0_0RNSScreen)
- (UIViewController *)parentViewController;
@end
