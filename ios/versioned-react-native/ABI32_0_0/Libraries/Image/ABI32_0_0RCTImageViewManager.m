/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>

#import "ABI32_0_0RCTImageLoader.h"
#import "ABI32_0_0RCTImageShadowView.h"
#import "ABI32_0_0RCTImageView.h"

@implementation ABI32_0_0RCTImageViewManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RCTShadowView *)shadowView
{
  return [ABI32_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI32_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI32_0_0RCTResizeMode)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI32_0_0RCTImageSource *>);
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI32_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI32_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI32_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI32_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI32_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI32_0_0RCTResponseErrorBlock)errorBlock)
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

ABI32_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI32_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI32_0_0RCTPromiseRejectBlock)reject)
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
