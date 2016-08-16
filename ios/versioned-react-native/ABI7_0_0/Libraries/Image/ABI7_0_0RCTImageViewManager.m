/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTImageLoader.h"
#import "ABI7_0_0RCTImageSource.h"
#import "ABI7_0_0RCTImageView.h"

@implementation ABI7_0_0RCTImageViewManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI7_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode, ABI7_0_0RCTResizeMode)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(source, ABI7_0_0RCTImageSource)
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI7_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI7_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI7_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI7_0_0RCT_EXPORT_METHOD(getSize:(NSURL *)imageURL
                  successBlock:(ABI7_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI7_0_0RCTResponseErrorBlock)errorBlock)
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
