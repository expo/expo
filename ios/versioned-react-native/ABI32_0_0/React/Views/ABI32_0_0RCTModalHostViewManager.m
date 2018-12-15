/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTModalHostViewManager.h"

#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTModalHostView.h"
#import "ABI32_0_0RCTModalHostViewController.h"
#import "ABI32_0_0RCTModalManager.h"
#import "ABI32_0_0RCTShadowView.h"
#import "ABI32_0_0RCTUtils.h"

@implementation ABI32_0_0RCTConvert (ABI32_0_0RCTModalHostView)

ABI32_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI32_0_0RCTModalHostShadowView : ABI32_0_0RCTShadowView

@end

@implementation ABI32_0_0RCTModalHostShadowView

- (void)insertReactABI32_0_0Subview:(id<ABI32_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI32_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI32_0_0RCTShadowView class]]) {
    ((ABI32_0_0RCTShadowView *)subview).size = ABI32_0_0RCTScreenSize();
  }
}

@end

@interface ABI32_0_0RCTModalHostViewManager () <ABI32_0_0RCTModalHostViewInteractor>

@end

@implementation ABI32_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0RCTModalHostView *view = [[ABI32_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI32_0_0RCTModalHostView *)modalHostView withViewController:(ABI32_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI32_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI32_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI32_0_0RCTModalHostView *)modalHostView withViewController:(ABI32_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI32_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI32_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI32_0_0RCTShadowView *)shadowView
{
  return [ABI32_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI32_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI32_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI32_0_0RCTDirectEventBlock)
#endif

@end
