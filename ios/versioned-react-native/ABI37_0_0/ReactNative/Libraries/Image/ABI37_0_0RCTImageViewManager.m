/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTImageViewManager.h>

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageSource.h>

#import <ABI37_0_0React/ABI37_0_0RCTImageShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageView.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageLoaderProtocol.h>

@implementation ABI37_0_0RCTImageViewManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RCTShadowView *)shadowView
{
  return [ABI37_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI37_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI37_0_0RCTResizeMode)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI37_0_0RCTImageSource *>);
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI37_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI37_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI37_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI37_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI37_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI37_0_0RCTResponseErrorBlock)errorBlock)
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

ABI37_0_0RCT_EXPORT_METHOD(getSizeWithHeaders:(ABI37_0_0RCTImageSource *)source
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI37_0_0RCTPromiseRejectBlock)reject)
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

ABI37_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI37_0_0RCTPromiseRejectBlock)reject)
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

ABI37_0_0RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI37_0_0RCTPromiseRejectBlock)reject)
{
  resolve([[self.bridge moduleForName:@"ImageLoader"] getImageCacheStatus:requests]);
}

@end
