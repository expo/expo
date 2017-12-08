/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>

#import "ABI24_0_0RCTImageLoader.h"
#import "ABI24_0_0RCTImageShadowView.h"
#import "ABI24_0_0RCTImageView.h"

@implementation ABI24_0_0RCTImageViewManager

ABI24_0_0RCT_EXPORT_MODULE()

- (ABI24_0_0RCTShadowView *)shadowView
{
  return [ABI24_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI24_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI24_0_0RCTResizeMode)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI24_0_0RCTImageSource *>);
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI24_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI24_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI24_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI24_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI24_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI24_0_0RCTResponseErrorBlock)errorBlock)
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

ABI24_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI24_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI24_0_0RCTPromiseRejectBlock)reject)
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
