/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTModalHostViewManager.h"

#import "ABI39_0_0RCTBridge.h"
#import "ABI39_0_0RCTModalHostView.h"
#import "ABI39_0_0RCTModalHostViewController.h"
#import "ABI39_0_0RCTShadowView.h"
#import "ABI39_0_0RCTUtils.h"

@implementation ABI39_0_0RCTConvert (ABI39_0_0RCTModalHostView)

ABI39_0_0RCT_ENUM_CONVERTER(
    UIModalPresentationStyle,
    (@{
      @"fullScreen" : @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
      @"pageSheet" : @(UIModalPresentationPageSheet),
      @"formSheet" : @(UIModalPresentationFormSheet),
#endif
      @"overFullScreen" : @(UIModalPresentationOverFullScreen),
    }),
    UIModalPresentationFullScreen,
    integerValue)

@end

@interface ABI39_0_0RCTModalHostShadowView : ABI39_0_0RCTShadowView

@end

@implementation ABI39_0_0RCTModalHostShadowView

- (void)insertABI39_0_0ReactSubview:(id<ABI39_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI39_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI39_0_0RCTShadowView class]]) {
    ((ABI39_0_0RCTShadowView *)subview).size = ABI39_0_0RCTScreenSize();
  }
}

@end

@interface ABI39_0_0RCTModalHostViewManager () <ABI39_0_0RCTModalHostViewInteractor>

@end

@implementation ABI39_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0RCTModalHostView *view = [[ABI39_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI39_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI39_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI39_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI39_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI39_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI39_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI39_0_0ReactViewController], viewController, animated, nil);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:nil];
  }
}

- (ABI39_0_0RCTShadowView *)shadowView
{
  return [ABI39_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI39_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI39_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI39_0_0RCTDirectEventBlock)
#endif

@end
