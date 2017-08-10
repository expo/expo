/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTModalHostViewManager.h"

#import "ABI20_0_0RCTBridge.h"
#import "ABI20_0_0RCTModalHostView.h"
#import "ABI20_0_0RCTModalHostViewController.h"
#import "ABI20_0_0RCTShadowView.h"
#import "ABI20_0_0RCTUtils.h"

@implementation ABI20_0_0RCTConvert (ABI20_0_0RCTModalHostView)

ABI20_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI20_0_0RCTModalHostShadowView : ABI20_0_0RCTShadowView

@end

@implementation ABI20_0_0RCTModalHostShadowView

- (void)insertReactABI20_0_0Subview:(id<ABI20_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI20_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI20_0_0RCTShadowView class]]) {
    ((ABI20_0_0RCTShadowView *)subview).size = ABI20_0_0RCTScreenSize();
  }
}

@end

@interface ABI20_0_0RCTModalHostViewManager () <ABI20_0_0RCTModalHostViewInteractor>

@end

@implementation ABI20_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0RCTModalHostView *view = [[ABI20_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI20_0_0RCTModalHostView *)modalHostView withViewController:(ABI20_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI20_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI20_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI20_0_0RCTModalHostView *)modalHostView withViewController:(ABI20_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI20_0_0ViewController], viewController, animated, nil);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:nil];
  }
}


- (ABI20_0_0RCTShadowView *)shadowView
{
  return [ABI20_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI20_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI20_0_0RCTDirectEventBlock)

@end
