/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0RCTModalHostViewManager.h"

#import "ABI21_0_0RCTBridge.h"
#import "ABI21_0_0RCTModalHostView.h"
#import "ABI21_0_0RCTModalHostViewController.h"
#import "ABI21_0_0RCTShadowView.h"
#import "ABI21_0_0RCTUtils.h"

@implementation ABI21_0_0RCTConvert (ABI21_0_0RCTModalHostView)

ABI21_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI21_0_0RCTModalHostShadowView : ABI21_0_0RCTShadowView

@end

@implementation ABI21_0_0RCTModalHostShadowView

- (void)insertReactABI21_0_0Subview:(id<ABI21_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI21_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI21_0_0RCTShadowView class]]) {
    ((ABI21_0_0RCTShadowView *)subview).size = ABI21_0_0RCTScreenSize();
  }
}

@end

@interface ABI21_0_0RCTModalHostViewManager () <ABI21_0_0RCTModalHostViewInteractor>

@end

@implementation ABI21_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0RCTModalHostView *view = [[ABI21_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI21_0_0RCTModalHostView *)modalHostView withViewController:(ABI21_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI21_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI21_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI21_0_0RCTModalHostView *)modalHostView withViewController:(ABI21_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI21_0_0ViewController], viewController, animated, nil);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:nil];
  }
}


- (ABI21_0_0RCTShadowView *)shadowView
{
  return [ABI21_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI21_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI21_0_0RCTDirectEventBlock)

@end
