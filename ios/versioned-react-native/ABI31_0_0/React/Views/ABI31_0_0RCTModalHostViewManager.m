/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTModalHostViewManager.h"

#import "ABI31_0_0RCTBridge.h"
#import "ABI31_0_0RCTModalHostView.h"
#import "ABI31_0_0RCTModalHostViewController.h"
#import "ABI31_0_0RCTModalManager.h"
#import "ABI31_0_0RCTShadowView.h"
#import "ABI31_0_0RCTUtils.h"

@implementation ABI31_0_0RCTConvert (ABI31_0_0RCTModalHostView)

ABI31_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI31_0_0RCTModalHostShadowView : ABI31_0_0RCTShadowView

@end

@implementation ABI31_0_0RCTModalHostShadowView

- (void)insertReactABI31_0_0Subview:(id<ABI31_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI31_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI31_0_0RCTShadowView class]]) {
    ((ABI31_0_0RCTShadowView *)subview).size = ABI31_0_0RCTScreenSize();
  }
}

@end

@interface ABI31_0_0RCTModalHostViewManager () <ABI31_0_0RCTModalHostViewInteractor>

@end

@implementation ABI31_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0RCTModalHostView *view = [[ABI31_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI31_0_0RCTModalHostView *)modalHostView withViewController:(ABI31_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI31_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI31_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI31_0_0RCTModalHostView *)modalHostView withViewController:(ABI31_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI31_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI31_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI31_0_0RCTShadowView *)shadowView
{
  return [ABI31_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI31_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI31_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI31_0_0RCTDirectEventBlock)
#endif

@end
