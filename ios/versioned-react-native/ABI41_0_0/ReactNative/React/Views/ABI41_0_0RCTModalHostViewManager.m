/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTModalHostViewManager.h"

#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTModalHostView.h"
#import "ABI41_0_0RCTModalHostViewController.h"
#import "ABI41_0_0RCTShadowView.h"
#import "ABI41_0_0RCTUtils.h"

@implementation ABI41_0_0RCTConvert (ABI41_0_0RCTModalHostView)

ABI41_0_0RCT_ENUM_CONVERTER(
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

@interface ABI41_0_0RCTModalHostShadowView : ABI41_0_0RCTShadowView

@end

@implementation ABI41_0_0RCTModalHostShadowView

- (void)insertABI41_0_0ReactSubview:(id<ABI41_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertABI41_0_0ReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI41_0_0RCTShadowView class]]) {
    ((ABI41_0_0RCTShadowView *)subview).size = ABI41_0_0RCTScreenSize();
  }
}

@end

@interface ABI41_0_0RCTModalHostViewManager () <ABI41_0_0RCTModalHostViewInteractor>

@end

@implementation ABI41_0_0RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0RCTModalHostView *view = [[ABI41_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(ABI41_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI41_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView ABI41_0_0ReactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView ABI41_0_0ReactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(ABI41_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI41_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView ABI41_0_0ReactViewController], viewController, animated, nil);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:nil];
  }
}

- (ABI41_0_0RCTShadowView *)shadowView
{
  return [ABI41_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI41_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  _hostViews = nil;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, ABI41_0_0RCTDirectEventBlock)

#if TARGET_OS_TV
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onRequestClose, ABI41_0_0RCTDirectEventBlock)
#endif

@end
