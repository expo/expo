/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTImageLoader.h"
#import "ABI5_0_0RCTImageSource.h"
#import "ABI5_0_0RCTImageView.h"

@implementation ABI5_0_0RCTImageViewManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI5_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI5_0_0RCTDirectEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI5_0_0RCTDirectEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI5_0_0RCTDirectEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI5_0_0RCTDirectEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI5_0_0RCTDirectEventBlock)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode, ABI5_0_0RCTResizeMode)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(source, ABI5_0_0RCTImageSource)
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI5_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI5_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI5_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI5_0_0RCT_EXPORT_METHOD(getSize:(NSURL *)imageURL
                  successBlock:(ABI5_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI5_0_0RCTResponseErrorBlock)errorBlock)
{
  [self.bridge.imageLoader getImageSize:imageURL.absoluteString
                                  block:^(NSError *error, CGSize size) {
                                    if (error) {
                                      errorBlock(error);
                                    } else {
                                      successBlock(@[@(size.width), @(size.height)]);
                                    }
                                  }];
}

@end
