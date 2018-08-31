/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>

#import "ABI30_0_0RCTImageLoader.h"
#import "ABI30_0_0RCTImageShadowView.h"
#import "ABI30_0_0RCTImageView.h"

@implementation ABI30_0_0RCTImageViewManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0RCTShadowView *)shadowView
{
  return [ABI30_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI30_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI30_0_0RCTResizeMode)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI30_0_0RCTImageSource *>);
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI30_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI30_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI30_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI30_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI30_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI30_0_0RCTResponseErrorBlock)errorBlock)
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

ABI30_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI30_0_0RCTPromiseRejectBlock)reject)
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
