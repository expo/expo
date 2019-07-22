/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>

#import "ABI34_0_0RCTImageLoader.h"
#import "ABI34_0_0RCTImageShadowView.h"
#import "ABI34_0_0RCTImageView.h"

@implementation ABI34_0_0RCTImageViewManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RCTShadowView *)shadowView
{
  return [ABI34_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI34_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI34_0_0RCTResizeMode)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI34_0_0RCTImageSource *>);
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI34_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI34_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI34_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI34_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI34_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI34_0_0RCTResponseErrorBlock)errorBlock)
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

ABI34_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI34_0_0RCTPromiseRejectBlock)reject)
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

ABI34_0_0RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI34_0_0RCTPromiseRejectBlock)reject)
{
  resolve([self.bridge.imageLoader getImageCacheStatus:requests]);
}

@end
