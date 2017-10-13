/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>

#import "ABI22_0_0RCTImageLoader.h"
#import "ABI22_0_0RCTImageShadowView.h"
#import "ABI22_0_0RCTImageView.h"

@implementation ABI22_0_0RCTImageViewManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RCTShadowView *)shadowView
{
  return [ABI22_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI22_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI22_0_0RCTResizeMode)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI22_0_0RCTImageSource *>);
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI22_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI22_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI22_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI22_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI22_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI22_0_0RCTResponseErrorBlock)errorBlock)
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

ABI22_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI22_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI22_0_0RCTPromiseRejectBlock)reject)
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
