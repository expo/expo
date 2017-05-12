/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTModalHostViewManager.h"

#import "ABI17_0_0RCTBridge.h"
#import "ABI17_0_0RCTModalHostView.h"
#import "ABI17_0_0RCTModalHostViewController.h"
#import "ABI17_0_0RCTShadowView.h"
#import "ABI17_0_0RCTUtils.h"

@interface ABI17_0_0RCTModalHostShadowView : ABI17_0_0RCTShadowView

@end

@implementation ABI17_0_0RCTModalHostShadowView

- (void)insertReactABI17_0_0Subview:(id<ABI17_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI17_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI17_0_0RCTShadowView class]]) {
    ((ABI17_0_0RCTShadowView *)subview).size = ABI17_0_0RCTScreenSize();
  }
}

@end

@interface ABI17_0_0RCTModalHostViewManager () <ABI17_0_0RCTModalHostViewInteractor>

@end

@implementation ABI17_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0RCTModalHostView *view = [[ABI17_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI17_0_0RCTModalHostView *)modalHostView withViewController:(ABI17_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI17_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI17_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI17_0_0RCTModalHostView *)modalHostView withViewController:(ABI17_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI17_0_0ViewController], viewController, animated, nil);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:nil];
  }
}


- (ABI17_0_0RCTShadowView *)shadowView
{
  return [ABI17_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI17_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI17_0_0RCTDirectEventBlock)

@end
