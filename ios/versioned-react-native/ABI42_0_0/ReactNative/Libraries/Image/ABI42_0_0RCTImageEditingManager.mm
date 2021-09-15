/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTImageEditingManager.h>

#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageLoader.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageStoreManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageLoaderProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>
#import <UIKit/UIKit.h>

#import "ABI42_0_0RCTImagePlugins.h"

@interface ABI42_0_0RCTImageEditingManager() <ABI42_0_0NativeImageEditorSpec>
@end

@implementation ABI42_0_0RCTImageEditingManager

ABI42_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

/**
 * Crops an image and adds the result to the image store.
 *
 * @param imageRequest An image URL
 * @param cropData Dictionary with `offset`, `size` and `displaySize`.
 *        `offset` and `size` are relative to the full-resolution image size.
 *        `displaySize` is an optimization - if specified, the image will
 *        be scaled down to `displaySize` rather than `size`.
 *        All units are in px (not points).
 */
ABI42_0_0RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(JS::NativeImageEditor::Options &)cropData
                  successCallback:(ABI42_0_0RCTResponseSenderBlock)successCallback
                  errorCallback:(ABI42_0_0RCTResponseSenderBlock)errorCallback)
{
  CGRect rect = {
    [ABI42_0_0RCTConvert CGPoint:@{
      @"x": @(cropData.offset().x()),
      @"y": @(cropData.offset().y()),
    }],
    [ABI42_0_0RCTConvert CGSize:@{
      @"width": @(cropData.size().width()),
      @"height": @(cropData.size().height()),
    }]
  };
  
  // We must keep a copy of cropData so that we can access data from it at a later time
  JS::NativeImageEditor::Options cropDataCopy = cropData;

  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES]
   loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
     if (error) {
       errorCallback(@[ABI42_0_0RCTJSErrorFromNSError(error)]);
       return;
     }

     // Crop image
     CGSize targetSize = rect.size;
     CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
     CGAffineTransform transform = ABI42_0_0RCTTransformFromTargetRect(image.size, targetRect);
     UIImage *croppedImage = ABI42_0_0RCTTransformImage(image, targetSize, image.scale, transform);

     // Scale image
     if (cropDataCopy.displaySize()) {
       targetSize = [ABI42_0_0RCTConvert CGSize:@{@"width": @(cropDataCopy.displaySize()->width()), @"height": @(cropDataCopy.displaySize()->height())}]; // in pixels
       ABI42_0_0RCTResizeMode resizeMode = [ABI42_0_0RCTConvert ABI42_0_0RCTResizeMode:cropDataCopy.resizeMode() ?: @"contain"];
       targetRect = ABI42_0_0RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
       transform = ABI42_0_0RCTTransformFromTargetRect(croppedImage.size, targetRect);
       croppedImage = ABI42_0_0RCTTransformImage(croppedImage, targetSize, image.scale, transform);
     }

     // Store image
     [self->_bridge.imageStoreManager storeImage:croppedImage withBlock:^(NSString *croppedImageTag) {
       if (!croppedImageTag) {
         NSString *errorMessage = @"Error storing cropped image in ABI42_0_0RCTImageStoreManager";
         ABI42_0_0RCTLogWarn(@"%@", errorMessage);
         errorCallback(@[ABI42_0_0RCTJSErrorFromNSError(ABI42_0_0RCTErrorWithMessage(errorMessage))]);
         return;
       }
       successCallback(@[croppedImageTag]);
     }];
   }];
}

- (std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI42_0_0facebook::ABI42_0_0React::NativeImageEditorSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI42_0_0RCTImageEditingManagerCls() {
  return ABI42_0_0RCTImageEditingManager.class;
}
