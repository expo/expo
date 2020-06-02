/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTImageViewManager.h>

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageSource.h>

#import <ABI38_0_0React/ABI38_0_0RCTImageShadowView.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageView.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageLoaderProtocol.h>

@implementation ABI38_0_0RCTImageViewManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RCTShadowView *)shadowView
{
  return [ABI38_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI38_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI38_0_0RCTResizeMode)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI38_0_0RCTImageSource *>);
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI38_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI38_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI38_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI38_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI38_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI38_0_0RCTResponseErrorBlock)errorBlock)
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

ABI38_0_0RCT_EXPORT_METHOD(getSizeWithHeaders:(ABI38_0_0RCTImageSource *)source
                  resolve:(ABI38_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI38_0_0RCTPromiseRejectBlock)reject)
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

ABI38_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI38_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI38_0_0RCTPromiseRejectBlock)reject)
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

ABI38_0_0RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(ABI38_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI38_0_0RCTPromiseRejectBlock)reject)
{
  resolve([[self.bridge moduleForName:@"ImageLoader"] getImageCacheStatus:requests]);
}

@end
