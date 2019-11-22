/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTModalHostViewManager.h"

#import "ABI36_0_0RCTBridge.h"
#import "ABI36_0_0RCTModalHostView.h"
#import "ABI36_0_0RCTModalHostViewController.h"
#import "ABI36_0_0RCTModalManager.h"
#import "ABI36_0_0RCTShadowView.h"
#import "ABI36_0_0RCTUtils.h"

@implementation ABI36_0_0RCTConvert (ABI36_0_0RCTModalHostView)

ABI36_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI36_0_0RCTModalHostShadowView : ABI36_0_0RCTShadowView

@end

@implementation ABI36_0_0RCTModalHostShadowView

- (void)insertABI36_0_0ReactSubview:(id<ABI36_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI36_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI36_0_0RCTShadowView class]]) {
    ((ABI36_0_0RCTShadowView *)subview).size = ABI36_0_0RCTScreenSize();
  }
}

@end

@interface ABI36_0_0RCTModalHostViewManager () <ABI36_0_0RCTModalHostViewInteractor>

@end

@implementation ABI36_0_0RCTModalHostViewManager
{
  NSPointerArray *_hostViews;
}

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0RCTModalHostView *view = [[ABI36_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI36_0_0RCTModalHostView *)modalHostView withViewController:(ABI36_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI36_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI36_0_0ReactViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI36_0_0RCTModalHostView *)modalHostView withViewController:(ABI36_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI36_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI36_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI36_0_0RCTShadowView *)shadowView
{
  return [ABI36_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI36_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI36_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI36_0_0RCTDirectEventBlock)
#endif

@end
