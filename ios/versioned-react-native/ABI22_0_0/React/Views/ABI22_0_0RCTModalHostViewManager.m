/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTModalHostViewManager.h"

#import "ABI22_0_0RCTBridge.h"
#import "ABI22_0_0RCTModalHostView.h"
#import "ABI22_0_0RCTModalHostViewController.h"
#import "ABI22_0_0RCTShadowView.h"
#import "ABI22_0_0RCTUtils.h"

@implementation ABI22_0_0RCTConvert (ABI22_0_0RCTModalHostView)

ABI22_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI22_0_0RCTModalHostShadowView : ABI22_0_0RCTShadowView

@end

@implementation ABI22_0_0RCTModalHostShadowView

- (void)insertReactABI22_0_0Subview:(id<ABI22_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI22_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI22_0_0RCTShadowView class]]) {
    ((ABI22_0_0RCTShadowView *)subview).size = ABI22_0_0RCTScreenSize();
  }
}

@end

@interface ABI22_0_0RCTModalHostViewManager () <ABI22_0_0RCTModalHostViewInteractor>

@end

@implementation ABI22_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0RCTModalHostView *view = [[ABI22_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI22_0_0RCTModalHostView *)modalHostView withViewController:(ABI22_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI22_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI22_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI22_0_0RCTModalHostView *)modalHostView withViewController:(ABI22_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI22_0_0ViewController], viewController, animated, nil);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:nil];
  }
}


- (ABI22_0_0RCTShadowView *)shadowView
{
  return [ABI22_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI22_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI22_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI22_0_0RCTDirectEventBlock)
#endif

@end
