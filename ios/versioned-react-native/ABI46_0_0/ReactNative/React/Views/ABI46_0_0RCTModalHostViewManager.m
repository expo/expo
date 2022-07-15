/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTModalHostViewManager.h"

#import "ABI46_0_0RCTBridge.h"
#import "ABI46_0_0RCTModalHostView.h"
#import "ABI46_0_0RCTModalHostViewController.h"
#import "ABI46_0_0RCTModalManager.h"
#import "ABI46_0_0RCTShadowView.h"
#import "ABI46_0_0RCTUtils.h"

@implementation ABI46_0_0RCTConvert (ABI46_0_0RCTModalHostView)

ABI46_0_0RCT_ENUM_CONVERTER(
    UIModalPresentationStyle,
    (@{
      @"fullScreen" : @(UIModalPresentationFullScreen),
      @"pageSheet" : @(UIModalPresentationPageSheet),
      @"formSheet" : @(UIModalPresentationFormSheet),
      @"overFullScreen" : @(UIModalPresentationOverFullScreen),
    }),
    UIModalPresentationFullScreen,
    integerValue)

@end

@interface ABI46_0_0RCTModalHostShadowView : ABI46_0_0RCTShadowView

@end

@implementation ABI46_0_0RCTModalHostShadowView

- (void)insertABI46_0_0ReactSubview:(id<ABI46_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI46_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI46_0_0RCTShadowView class]]) {
    ((ABI46_0_0RCTShadowView *)subview).size = ABI46_0_0RCTScreenSize();
  }
}

@end

@interface ABI46_0_0RCTModalHostViewManager () <ABI46_0_0RCTModalHostViewInteractor>

@end

@implementation ABI46_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0RCTModalHostView *view = [[ABI46_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI46_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI46_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI46_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI46_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI46_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI46_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI46_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI46_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}

- (ABI46_0_0RCTShadowView *)shadowView
{
  return [ABI46_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI46_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarTranslucent, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(hardwareAccelerated, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI46_0_0RCTDirectEventBlock)

// Fabric only
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onDismiss, ABI46_0_0RCTDirectEventBlock)

@end
