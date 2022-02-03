/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTModalHostViewManager.h"

#import "ABI43_0_0RCTBridge.h"
#import "ABI43_0_0RCTModalHostView.h"
#import "ABI43_0_0RCTModalHostViewController.h"
#import "ABI43_0_0RCTModalManager.h"
#import "ABI43_0_0RCTShadowView.h"
#import "ABI43_0_0RCTUtils.h"

@implementation ABI43_0_0RCTConvert (ABI43_0_0RCTModalHostView)

ABI43_0_0RCT_ENUM_CONVERTER(
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

@interface ABI43_0_0RCTModalHostShadowView : ABI43_0_0RCTShadowView

@end

@implementation ABI43_0_0RCTModalHostShadowView

- (void)insertABI43_0_0ReactSubview:(id<ABI43_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI43_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI43_0_0RCTShadowView class]]) {
    ((ABI43_0_0RCTShadowView *)subview).size = ABI43_0_0RCTScreenSize();
  }
}

@end

@interface ABI43_0_0RCTModalHostViewManager () <ABI43_0_0RCTModalHostViewInteractor>

@end

@implementation ABI43_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0RCTModalHostView *view = [[ABI43_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI43_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI43_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI43_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI43_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI43_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI43_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI43_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI43_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}

- (ABI43_0_0RCTShadowView *)shadowView
{
  return [ABI43_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI43_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI43_0_0RCTDirectEventBlock)

@end
