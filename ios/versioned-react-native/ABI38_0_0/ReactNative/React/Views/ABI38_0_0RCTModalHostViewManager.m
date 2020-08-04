/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTModalHostViewManager.h"

#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTModalHostView.h"
#import "ABI38_0_0RCTModalHostViewController.h"
#import "ABI38_0_0RCTModalManager.h"
#import "ABI38_0_0RCTShadowView.h"
#import "ABI38_0_0RCTUtils.h"

@implementation ABI38_0_0RCTConvert (ABI38_0_0RCTModalHostView)

ABI38_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI38_0_0RCTModalHostShadowView : ABI38_0_0RCTShadowView

@end

@implementation ABI38_0_0RCTModalHostShadowView

- (void)insertABI38_0_0ReactSubview:(id<ABI38_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI38_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI38_0_0RCTShadowView class]]) {
    ((ABI38_0_0RCTShadowView *)subview).size = ABI38_0_0RCTScreenSize();
  }
}

@end

@interface ABI38_0_0RCTModalHostViewManager () <ABI38_0_0RCTModalHostViewInteractor>

@end

@implementation ABI38_0_0RCTModalHostViewManager
{
  NSPointerArray *_hostViews;
}

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0RCTModalHostView *view = [[ABI38_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI38_0_0RCTModalHostView *)modalHostView withViewController:(ABI38_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI38_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI38_0_0ReactViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI38_0_0RCTModalHostView *)modalHostView withViewController:(ABI38_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI38_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI38_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI38_0_0RCTShadowView *)shadowView
{
  return [ABI38_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI38_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI38_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI38_0_0RCTDirectEventBlock)
#endif

@end
