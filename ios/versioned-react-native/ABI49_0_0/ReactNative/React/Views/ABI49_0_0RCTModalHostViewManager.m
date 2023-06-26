/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTModalHostViewManager.h"

#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTModalHostView.h"
#import "ABI49_0_0RCTModalHostViewController.h"
#import "ABI49_0_0RCTModalManager.h"
#import "ABI49_0_0RCTShadowView.h"
#import "ABI49_0_0RCTUtils.h"

@implementation ABI49_0_0RCTConvert (ABI49_0_0RCTModalHostView)

ABI49_0_0RCT_ENUM_CONVERTER(
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

@interface ABI49_0_0RCTModalHostShadowView : ABI49_0_0RCTShadowView

@end

@implementation ABI49_0_0RCTModalHostShadowView

- (void)insertABI49_0_0ReactSubview:(id<ABI49_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI49_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI49_0_0RCTShadowView class]]) {
    ((ABI49_0_0RCTShadowView *)subview).size = ABI49_0_0RCTScreenSize();
  }
}

@end

@interface ABI49_0_0RCTModalHostViewManager () <ABI49_0_0RCTModalHostViewInteractor>

@end

@implementation ABI49_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0RCTModalHostView *view = [[ABI49_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI49_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI49_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_presentationBlock) {
      self->_presentationBlock([modalHostView ABI49_0_0ReactViewController], viewController, animated, completionBlock);
    } else {
      [[modalHostView ABI49_0_0ReactViewController] presentViewController:viewController
                                                        animated:animated
                                                      completion:completionBlock];
    }
  });
}

- (void)dismissModalHostView:(ABI49_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI49_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI49_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_dismissalBlock) {
      self->_dismissalBlock([modalHostView ABI49_0_0ReactViewController], viewController, animated, completionBlock);
    } else {
      [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
    }
  });
}

- (ABI49_0_0RCTShadowView *)shadowView
{
  return [ABI49_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI49_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarTranslucent, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(hardwareAccelerated, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI49_0_0RCTDirectEventBlock)

// Fabric only
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onDismiss, ABI49_0_0RCTDirectEventBlock)

@end
