#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import "RNSScreenContainer.h"

@class RNSScreenContainerView;

@interface RNSScreenManager : RCTViewManager
@end

@interface RNSScreenView : RCTView <RCTInvalidating>

@property (weak, nonatomic) UIView<RNSScreenContainerDelegate> *reactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic) BOOL active;

@end

@interface UIView (RNSScreen)
- (UIViewController *)parentViewController;
@end
