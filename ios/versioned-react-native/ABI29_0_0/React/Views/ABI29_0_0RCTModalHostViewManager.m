/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTModalHostViewManager.h"

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTModalHostView.h"
#import "ABI29_0_0RCTModalHostViewController.h"
#import "ABI29_0_0RCTModalManager.h"
#import "ABI29_0_0RCTShadowView.h"
#import "ABI29_0_0RCTUtils.h"

@implementation ABI29_0_0RCTConvert (ABI29_0_0RCTModalHostView)

ABI29_0_0RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface ABI29_0_0RCTModalHostShadowView : ABI29_0_0RCTShadowView

@end

@implementation ABI29_0_0RCTModalHostShadowView

- (void)insertReactABI29_0_0Subview:(id<ABI29_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI29_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI29_0_0RCTShadowView class]]) {
    ((ABI29_0_0RCTShadowView *)subview).size = ABI29_0_0RCTScreenSize();
  }
}

@end

@interface ABI29_0_0RCTModalHostViewManager () <ABI29_0_0RCTModalHostViewInteractor>

@end

@implementation ABI29_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0RCTModalHostView *view = [[ABI29_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(ABI29_0_0RCTModalHostView *)modalHostView withViewController:(ABI29_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ReactABI29_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ReactABI29_0_0ViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI29_0_0RCTModalHostView *)modalHostView withViewController:(ABI29_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI29_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ReactABI29_0_0ViewController], viewController, animated, completionBlock);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (ABI29_0_0RCTShadowView *)shadowView
{
  return [ABI29_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI29_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI29_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI29_0_0RCTDirectEventBlock)
#endif

@end
