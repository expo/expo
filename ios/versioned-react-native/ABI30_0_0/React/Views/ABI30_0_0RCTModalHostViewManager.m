/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTModalHostViewManager.h"

#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTModalHostView.h"
#import "ABI30_0_0RCTModalHostViewController.h"
#import "ABI30_0_0RCTModalManager.h"
#import "ABI30_0_0RCTShadowView.h"
#import "ABI30_0_0RCTUtils.h"

@implementation ABI30_0_0RCTConvert (ABI30_0_0RCTModalHostView)

ABI30_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI30_0_0RCTModalHostShadowView : ABI30_0_0RCTShadowView

@end

@implementation ABI30_0_0RCTModalHostShadowView

- (void)insertReactABI30_0_0Subview:(id<ABI30_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI30_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI30_0_0RCTShadowView class]]) {
    ((ABI30_0_0RCTShadowView *)subview).size = ABI30_0_0RCTScreenSize();
  }
}

@end

@interface ABI30_0_0RCTModalHostViewManager () <ABI30_0_0RCTModalHostViewInteractor>

@end

@implementation ABI30_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0RCTModalHostView *view = [[ABI30_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI30_0_0RCTModalHostView *)modalHostView withViewController:(ABI30_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI30_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI30_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI30_0_0RCTModalHostView *)modalHostView withViewController:(ABI30_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI30_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI30_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI30_0_0RCTShadowView *)shadowView
{
  return [ABI30_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI30_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI30_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI30_0_0RCTDirectEventBlock)
#endif

@end
