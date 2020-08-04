/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTModalHostViewManager.h"

#import "ABI37_0_0RCTBridge.h"
#import "ABI37_0_0RCTModalHostView.h"
#import "ABI37_0_0RCTModalHostViewController.h"
#import "ABI37_0_0RCTModalManager.h"
#import "ABI37_0_0RCTShadowView.h"
#import "ABI37_0_0RCTUtils.h"

@implementation ABI37_0_0RCTConvert (ABI37_0_0RCTModalHostView)

ABI37_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI37_0_0RCTModalHostShadowView : ABI37_0_0RCTShadowView

@end

@implementation ABI37_0_0RCTModalHostShadowView

- (void)insertABI37_0_0ReactSubview:(id<ABI37_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI37_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI37_0_0RCTShadowView class]]) {
    ((ABI37_0_0RCTShadowView *)subview).size = ABI37_0_0RCTScreenSize();
  }
}

@end

@interface ABI37_0_0RCTModalHostViewManager () <ABI37_0_0RCTModalHostViewInteractor>

@end

@implementation ABI37_0_0RCTModalHostViewManager
{
  NSPointerArray *_hostViews;
}

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0RCTModalHostView *view = [[ABI37_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI37_0_0RCTModalHostView *)modalHostView withViewController:(ABI37_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI37_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI37_0_0ReactViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI37_0_0RCTModalHostView *)modalHostView withViewController:(ABI37_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI37_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI37_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI37_0_0RCTShadowView *)shadowView
{
  return [ABI37_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI37_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI37_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI37_0_0RCTDirectEventBlock)
#endif

@end
