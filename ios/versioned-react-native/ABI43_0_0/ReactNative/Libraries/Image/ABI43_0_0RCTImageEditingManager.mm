/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTImageEditingManager.h>

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageLoader.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageStoreManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageUtils.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageLoaderProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>
#import <UIKit/UIKit.h>

#import "ABI43_0_0RCTImagePlugins.h"

@interface ABI43_0_0RCTImageEditingManager() <ABI43_0_0NativeImageEditorSpec>
@end

@implementation ABI43_0_0RCTImageEditingManager

ABI43_0_0RCT_EXPORT_MODULE()

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
ABI43_0_0RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(JS::NativeImageEditor::Options &)cropData
                  successCallback:(ABI43_0_0RCTResponseSenderBlock)successCallback
                  errorCallback:(ABI43_0_0RCTResponseSenderBlock)errorCallback)
{
  CGRect rect = {
    [ABI43_0_0RCTConvert CGPoint:@{
      @"x": @(cropData.offset().x()),
      @"y": @(cropData.offset().y()),
    }],
    [ABI43_0_0RCTConvert CGSize:@{
      @"width": @(cropData.size().width()),
      @"height": @(cropData.size().height()),
    }]
  };
  
  // We must keep a copy of cropData so that we can access data from it at a later time
  JS::NativeImageEditor::Options cropDataCopy = cropData;

  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES]
   loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
     if (error) {
       errorCallback(@[ABI43_0_0RCTJSErrorFromNSError(error)]);
       return;
     }

     // Crop image
     CGSize targetSize = rect.size;
     CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
     CGAffineTransform transform = ABI43_0_0RCTTransformFromTargetRect(image.size, targetRect);
     UIImage *croppedImage = ABI43_0_0RCTTransformImage(image, targetSize, image.scale, transform);

     // Scale image
     if (cropDataCopy.displaySize()) {
       targetSize = [ABI43_0_0RCTConvert CGSize:@{@"width": @(cropDataCopy.displaySize()->width()), @"height": @(cropDataCopy.displaySize()->height())}]; // in pixels
       ABI43_0_0RCTResizeMode resizeMode = [ABI43_0_0RCTConvert ABI43_0_0RCTResizeMode:cropDataCopy.resizeMode() ?: @"contain"];
       targetRect = ABI43_0_0RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
       transform = ABI43_0_0RCTTransformFromTargetRect(croppedImage.size, targetRect);
       croppedImage = ABI43_0_0RCTTransformImage(croppedImage, targetSize, image.scale, transform);
     }

     // Store image
     [self->_bridge.imageStoreManager storeImage:croppedImage withBlock:^(NSString *croppedImageTag) {
       if (!croppedImageTag) {
         NSString *errorMessage = @"Error storing cropped image in ABI43_0_0RCTImageStoreManager";
         ABI43_0_0RCTLogWarn(@"%@", errorMessage);
         errorCallback(@[ABI43_0_0RCTJSErrorFromNSError(ABI43_0_0RCTErrorWithMessage(errorMessage))]);
         return;
       }
       successCallback(@[croppedImageTag]);
     }];
   }];
}

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:(const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeImageEditorSpecJSI>(params);
}

@end

Class ABI43_0_0RCTImageEditingManagerCls() {
  return ABI43_0_0RCTImageEditingManager.class;
}
