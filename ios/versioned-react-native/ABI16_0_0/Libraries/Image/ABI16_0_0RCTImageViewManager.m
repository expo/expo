/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>

#import "ABI16_0_0RCTImageLoader.h"
#import "ABI16_0_0RCTImageView.h"

@implementation ABI16_0_0RCTImageViewManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI16_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI16_0_0RCTResizeMode)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI16_0_0RCTImageSource *>);
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI16_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI16_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI16_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI16_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI16_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI16_0_0RCTResponseErrorBlock)errorBlock)
{
  [self.bridge.imageLoader getImageSizeForURLRequest:request
                                               block:^(NSError *error, CGSize size) {
                                                 if (error) {
                                                   errorBlock(error);
                                                 } else {
                                                   successBlock(@[@(size.width), @(size.height)]);
                                                 }
                                               }];
}

ABI16_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI16_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if (!request) {
    reject(@"E_INVALID_URI", @"Cannot prefetch an image for an empty URI", nil);
    return;
  }

  [self.bridge.imageLoader loadImageWithURLRequest:request
                                          callback:^(NSError *error, UIImage *image) {
                                            if (error) {
                                              reject(@"E_PREFETCH_FAILURE", nil, error);
                                              return;
                                            }
                                            resolve(@YES);
                                          }];
}

@end
