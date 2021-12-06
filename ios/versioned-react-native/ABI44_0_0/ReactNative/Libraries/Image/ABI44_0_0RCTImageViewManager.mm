/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTImageViewManager.h>

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTImageSource.h>

#import <ABI44_0_0React/ABI44_0_0RCTImageShadowView.h>
#import <ABI44_0_0React/ABI44_0_0RCTImageView.h>
#import <ABI44_0_0React/ABI44_0_0RCTImageLoaderProtocol.h>

@implementation ABI44_0_0RCTImageViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RCTShadowView *)shadowView
{
  return [ABI44_0_0RCTImageShadowView new];
}

- (UIView *)view
{
  return [[ABI44_0_0RCTImageView alloc] initWithBridge:self.bridge];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadStart, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onProgress, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onLoad, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, ABI44_0_0RCTResizeMode)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(internal_analyticTag, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<ABI44_0_0RCTImageSource *>);
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, ABI44_0_0RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[ABI44_0_0RCTImageView setTintColor:]`
  view.tintColor = [ABI44_0_0RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

ABI44_0_0RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(ABI44_0_0RCTResponseSenderBlock)successBlock
                  errorBlock:(ABI44_0_0RCTResponseErrorBlock)errorBlock)
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

ABI44_0_0RCT_EXPORT_METHOD(getSizeWithHeaders:(ABI44_0_0RCTImageSource *)source
                  resolve:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI44_0_0RCTPromiseRejectBlock)reject)
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

ABI44_0_0RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI44_0_0RCTPromiseRejectBlock)reject)
{
  if (!request) {
    reject(@"E_INVALID_URI", @"Cannot prefetch an image for an empty URI", nil);
    return;
  }
    id<ABI44_0_0RCTImageLoaderProtocol> imageLoader = (id<ABI44_0_0RCTImageLoaderProtocol>)[self.bridge
                                                                          moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES];
    [imageLoader loadImageWithURLRequest:request
                                priority:ABI44_0_0RCTImageLoaderPriorityPrefetch
                                callback:^(NSError *error, UIImage *image) {
        if (error) {
            reject(@"E_PREFETCH_FAILURE", nil, error);
            return;
        }
        resolve(@YES);
    }];
}

ABI44_0_0RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI44_0_0RCTPromiseRejectBlock)reject)
{
  resolve([[self.bridge moduleForName:@"ImageLoader"] getImageCacheStatus:requests]);
}

@end
