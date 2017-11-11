/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTModalHostViewManager.h"

#import "ABI23_0_0RCTBridge.h"
#import "ABI23_0_0RCTModalHostView.h"
#import "ABI23_0_0RCTModalHostViewController.h"
#import "ABI23_0_0RCTModalManager.h"
#import "ABI23_0_0RCTShadowView.h"
#import "ABI23_0_0RCTUtils.h"

@implementation ABI23_0_0RCTConvert (ABI23_0_0RCTModalHostView)

ABI23_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI23_0_0RCTModalHostShadowView : ABI23_0_0RCTShadowView

@end

@implementation ABI23_0_0RCTModalHostShadowView

- (void)insertReactABI23_0_0Subview:(id<ABI23_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI23_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI23_0_0RCTShadowView class]]) {
    ((ABI23_0_0RCTShadowView *)subview).size = ABI23_0_0RCTScreenSize();
  }
}

@end

@interface ABI23_0_0RCTModalHostViewManager () <ABI23_0_0RCTModalHostViewInteractor>

@end

@implementation ABI23_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0RCTModalHostView *view = [[ABI23_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI23_0_0RCTModalHostView *)modalHostView withViewController:(ABI23_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI23_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI23_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI23_0_0RCTModalHostView *)modalHostView withViewController:(ABI23_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI23_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI23_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI23_0_0RCTShadowView *)shadowView
{
  return [ABI23_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI23_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI23_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI23_0_0RCTDirectEventBlock)
#endif

@end
