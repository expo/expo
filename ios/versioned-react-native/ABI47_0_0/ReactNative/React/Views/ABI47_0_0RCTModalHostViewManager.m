/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTModalHostViewManager.h"

#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTModalHostView.h"
#import "ABI47_0_0RCTModalHostViewController.h"
#import "ABI47_0_0RCTModalManager.h"
#import "ABI47_0_0RCTShadowView.h"
#import "ABI47_0_0RCTUtils.h"

@implementation ABI47_0_0RCTConvert (ABI47_0_0RCTModalHostView)

ABI47_0_0RCT_ENUM_CONVERTER(
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

@interface ABI47_0_0RCTModalHostShadowView : ABI47_0_0RCTShadowView

@end

@implementation ABI47_0_0RCTModalHostShadowView

- (void)insertABI47_0_0ReactSubview:(id<ABI47_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI47_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI47_0_0RCTShadowView class]]) {
    ((ABI47_0_0RCTShadowView *)subview).size = ABI47_0_0RCTScreenSize();
  }
}

@end

@interface ABI47_0_0RCTModalHostViewManager () <ABI47_0_0RCTModalHostViewInteractor>

@end

@implementation ABI47_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0RCTModalHostView *view = [[ABI47_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI47_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI47_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI47_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI47_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI47_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI47_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI47_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI47_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}

- (ABI47_0_0RCTShadowView *)shadowView
{
  return [ABI47_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI47_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarTranslucent, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(hardwareAccelerated, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI47_0_0RCTDirectEventBlock)

// Fabric only
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onDismiss, ABI47_0_0RCTDirectEventBlock)

@end
