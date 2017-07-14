/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>

#import "ABI19_0_0RCTImageLoader.h"
#import "ABI19_0_0RCTImageShadowView.h"
#import "ABI19_0_0RCTImageView.h"

@implementation ABI19_0_0RCTImageViewManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RCTShadowView *)shadowView
{
  return [ABI19_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI19_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI19_0_0RCTResizeMode)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI19_0_0RCTImageSource *>);
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI19_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI19_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI19_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI19_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI19_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI19_0_0RCTResponseErrorBlock)errorBlock)
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

ABI19_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI19_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI19_0_0RCTPromiseRejectBlock)reject)
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
