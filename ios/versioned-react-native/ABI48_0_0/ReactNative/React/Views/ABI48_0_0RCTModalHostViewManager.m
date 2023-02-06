/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTModalHostViewManager.h"

#import "ABI48_0_0RCTBridge.h"
#import "ABI48_0_0RCTModalHostView.h"
#import "ABI48_0_0RCTModalHostViewController.h"
#import "ABI48_0_0RCTModalManager.h"
#import "ABI48_0_0RCTShadowView.h"
#import "ABI48_0_0RCTUtils.h"

@implementation ABI48_0_0RCTConvert (ABI48_0_0RCTModalHostView)

ABI48_0_0RCT_ENUM_CONVERTER(
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

@interface ABI48_0_0RCTModalHostShadowView : ABI48_0_0RCTShadowView

@end

@implementation ABI48_0_0RCTModalHostShadowView

- (void)insertABI48_0_0ReactSubview:(id<ABI48_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI48_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI48_0_0RCTShadowView class]]) {
    ((ABI48_0_0RCTShadowView *)subview).size = ABI48_0_0RCTScreenSize();
  }
}

@end

@interface ABI48_0_0RCTModalHostViewManager () <ABI48_0_0RCTModalHostViewInteractor>

@end

@implementation ABI48_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0RCTModalHostView *view = [[ABI48_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI48_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI48_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_presentationBlock) {
      self->_presentationBlock([modalHostView ABI48_0_0ReactViewController], viewController, animated, completionBlock);
    } else {
      [[modalHostView ABI48_0_0ReactViewController] presentViewController:viewController
                                                        animated:animated
                                                      completion:completionBlock];
    }
  });
}

- (void)dismissModalHostView:(ABI48_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI48_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI48_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_dismissalBlock) {
      self->_dismissalBlock([modalHostView ABI48_0_0ReactViewController], viewController, animated, completionBlock);
    } else {
      [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
    }
  });
}

- (ABI48_0_0RCTShadowView *)shadowView
{
  return [ABI48_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI48_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarTranslucent, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(hardwareAccelerated, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI48_0_0RCTDirectEventBlock)

// Fabric only
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDismiss, ABI48_0_0RCTDirectEventBlock)

@end
