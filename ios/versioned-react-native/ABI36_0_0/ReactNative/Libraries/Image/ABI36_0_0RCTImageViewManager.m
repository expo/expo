/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTImageViewManager.h>

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTImageSource.h>

#import <ABI36_0_0React/ABI36_0_0RCTImageShadowView.h>
#import <ABI36_0_0React/ABI36_0_0RCTImageView.h>
#import <ABI36_0_0React/ABI36_0_0RCTImageLoaderProtocol.h>

@implementation ABI36_0_0RCTImageViewManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RCTShadowView *)shadowView
{
  return [ABI36_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI36_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI36_0_0RCTResizeMode)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI36_0_0RCTImageSource *>);
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI36_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI36_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI36_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI36_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI36_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI36_0_0RCTResponseErrorBlock)errorBlock)
{
  [[self.bridge moduleForName:@"ImageLoader"]
   getImageSizeForURLRequest:request
   block:^(NSError *error, CGSize size) {
     if (error) {
       errorBlock(error);
     } else {
       successBlock(@[@(size.width), @(size.height)]);
     }
   }];
}

ABI36_0_0RCT_EXPORT_METHOD(getSizeWithHeaders:(ABI36_0_0RCTImageSource *)source
                  resolve:(ABI36_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI36_0_0RCTPromiseRejectBlock)reject)
{
  [[self.bridge moduleForName:@"ImageLoader"]
   getImageSizeForURLRequest:source.request
   block:^(NSError *error, CGSize size) {
     if (error) {
       reject(@"E_GET_SIZE_FAILURE", nil, error);
       return;
     }
     resolve(@{@"width":@(size.width),@"height":@(size.height)});
   }];
}

ABI36_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI36_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI36_0_0RCTPromiseRejectBlock)reject)
{
  if (!request) {
    reject(@"E_INVALID_URI", @"Cannot prefetch an image for an empty URI", nil);
    return;
  }

  [[self.bridge moduleForName:@"ImageLoader"]
   loadImageWithURLRequest:request
   callback:^(NSError *error, UIImage *image) {
     if (error) {
       reject(@"E_PREFETCH_FAILURE", nil, error);
       return;
     }
     resolve(@YES);
   }];
}

ABI36_0_0RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(ABI36_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI36_0_0RCTPromiseRejectBlock)reject)
{
  resolve([[self.bridge moduleForName:@"ImageLoader"] getImageCacheStatus:requests]);
}

@end
