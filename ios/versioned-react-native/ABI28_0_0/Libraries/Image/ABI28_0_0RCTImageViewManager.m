/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>

#import "ABI28_0_0RCTImageLoader.h"
#import "ABI28_0_0RCTImageShadowView.h"
#import "ABI28_0_0RCTImageView.h"

@implementation ABI28_0_0RCTImageViewManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RCTShadowView *)shadowView
{
  return [ABI28_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI28_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI28_0_0RCTResizeMode)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI28_0_0RCTImageSource *>);
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI28_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI28_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI28_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI28_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI28_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI28_0_0RCTResponseErrorBlock)errorBlock)
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

ABI28_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI28_0_0RCTPromiseRejectBlock)reject)
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
