/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTModalHostViewManager.h"

#import "ABI45_0_0RCTBridge.h"
#import "ABI45_0_0RCTModalHostView.h"
#import "ABI45_0_0RCTModalHostViewController.h"
#import "ABI45_0_0RCTModalManager.h"
#import "ABI45_0_0RCTShadowView.h"
#import "ABI45_0_0RCTUtils.h"

@implementation ABI45_0_0RCTConvert (ABI45_0_0RCTModalHostView)

ABI45_0_0RCT_ENUM_CONVERTER(
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

@interface ABI45_0_0RCTModalHostShadowView : ABI45_0_0RCTShadowView

@end

@implementation ABI45_0_0RCTModalHostShadowView

- (void)insertABI45_0_0ReactSubview:(id<ABI45_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI45_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI45_0_0RCTShadowView class]]) {
    ((ABI45_0_0RCTShadowView *)subview).size = ABI45_0_0RCTScreenSize();
  }
}

@end

@interface ABI45_0_0RCTModalHostViewManager () <ABI45_0_0RCTModalHostViewInteractor>

@end

@implementation ABI45_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0RCTModalHostView *view = [[ABI45_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI45_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI45_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI45_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI45_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI45_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI45_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI45_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI45_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}

- (ABI45_0_0RCTShadowView *)shadowView
{
  return [ABI45_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI45_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarTranslucent, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(hardwareAccelerated, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI45_0_0RCTDirectEventBlock)

// Fabric only
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDismiss, ABI45_0_0RCTDirectEventBlock)

@end
