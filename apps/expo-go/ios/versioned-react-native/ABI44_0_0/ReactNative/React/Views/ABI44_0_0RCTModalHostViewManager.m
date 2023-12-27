/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTModalHostViewManager.h"

#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTModalHostView.h"
#import "ABI44_0_0RCTModalHostViewController.h"
#import "ABI44_0_0RCTModalManager.h"
#import "ABI44_0_0RCTShadowView.h"
#import "ABI44_0_0RCTUtils.h"

@implementation ABI44_0_0RCTConvert (ABI44_0_0RCTModalHostView)

ABI44_0_0RCT_ENUM_CONVERTER(
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

@interface ABI44_0_0RCTModalHostShadowView : ABI44_0_0RCTShadowView

@end

@implementation ABI44_0_0RCTModalHostShadowView

- (void)insertABI44_0_0ReactSubview:(id<ABI44_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI44_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI44_0_0RCTShadowView class]]) {
    ((ABI44_0_0RCTShadowView *)subview).size = ABI44_0_0RCTScreenSize();
  }
}

@end

@interface ABI44_0_0RCTModalHostViewManager () <ABI44_0_0RCTModalHostViewInteractor>

@end

@implementation ABI44_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0RCTModalHostView *view = [[ABI44_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI44_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI44_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI44_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI44_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI44_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI44_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[ABI44_0_0RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI44_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}

- (ABI44_0_0RCTShadowView *)shadowView
{
  return [ABI44_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI44_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI44_0_0RCTDirectEventBlock)

@end
