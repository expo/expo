/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTImageViewManager.h>

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageSource.h>

#import <ABI42_0_0React/ABI42_0_0RCTImageShadowView.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageView.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageLoaderProtocol.h>

@implementation ABI42_0_0RCTImageViewManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RCTShadowView *)shadowView
{
  return [ABI42_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI42_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI42_0_0RCTResizeMode)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI42_0_0RCTImageSource *>);
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI42_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI42_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI42_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI42_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI42_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI42_0_0RCTResponseErrorBlock)errorBlock)
{
  [[self.bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES]
   getImageSizeForURLRequest:request
   block:^(NSError *error, CGSize size) {
     if (error) {
       errorBlock(error);
     } else {
       successBlock(@[@(size.width), @(size.height)]);
     }
   }];
}

ABI42_0_0RCT_EXPORT_METHOD(getSizeWithHeaders:(ABI42_0_0RCTImageSource *)source
                  resolve:(ABI42_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI42_0_0RCTPromiseRejectBlock)reject)
{
  [[self.bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES]
   getImageSizeForURLRequest:source.request
   block:^(NSError *error, CGSize size) {
     if (error) {
       reject(@"E_GET_SIZE_FAILURE", nil, error);
       return;
     }
     resolve(@{@"width":@(size.width),@"height":@(size.height)});
   }];
}

ABI42_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI42_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI42_0_0RCTPromiseRejectBlock)reject)
{
  if (!request) {
    reject(@"E_INVALID_URI", @"Cannot prefetch an image for an empty URI", nil);
    return;
  }

  [[self.bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES]
   loadImageWithURLRequest:request
   callback:^(NSError *error, UIImage *image) {
     if (error) {
       reject(@"E_PREFETCH_FAILURE", nil, error);
       return;
     }
     resolve(@YES);
   }];
}

ABI42_0_0RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(ABI42_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI42_0_0RCTPromiseRejectBlock)reject)
{
  resolve([[self.bridge moduleForName:@"ImageLoader"] getImageCacheStatus:requests]);
}

@end
