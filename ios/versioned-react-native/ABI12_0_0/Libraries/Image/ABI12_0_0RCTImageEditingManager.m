/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTImageEditingManager.h"

#import <UIKit/UIKit.h>

#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTUtils.h"
#import "ABI12_0_0RCTImageUtils.h"

#import "ABI12_0_0RCTImageStoreManager.h"
#import "ABI12_0_0RCTImageLoader.h"

@implementation ABI12_0_0RCTImageEditingManager

ABI12_0_0RCT_EXPORT_MODULE()

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
ABI12_0_0RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(NSDictionary *)cropData
                  successCallback:(ABI12_0_0RCTResponseSenderBlock)successCallback
                  errorCallback:(ABI12_0_0RCTResponseErrorBlock)errorCallback)
{
  CGRect rect = {
    [ABI12_0_0RCTConvert CGPoint:cropData[@"offset"]],
    [ABI12_0_0RCTConvert CGSize:cropData[@"size"]]
  };

  [_bridge.imageLoader loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
    if (error) {
      errorCallback(error);
      return;
    }

    // Crop image
    CGSize targetSize = rect.size;
    CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
    CGAffineTransform transform = ABI12_0_0RCTTransformFromTargetRect(image.size, targetRect);
    UIImage *croppedImage = ABI12_0_0RCTTransformImage(image, targetSize, image.scale, transform);

    // Scale image
    if (cropData[@"displaySize"]) {
      targetSize = [ABI12_0_0RCTConvert CGSize:cropData[@"displaySize"]]; // in pixels
      ABI12_0_0RCTResizeMode resizeMode = [ABI12_0_0RCTConvert ABI12_0_0RCTResizeMode:cropData[@"resizeMode"] ?: @"contain"];
      targetRect = ABI12_0_0RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
      transform = ABI12_0_0RCTTransformFromTargetRect(croppedImage.size, targetRect);
      croppedImage = ABI12_0_0RCTTransformImage(croppedImage, targetSize, image.scale, transform);
    }

    // Store image
    [self->_bridge.imageStoreManager storeImage:croppedImage withBlock:^(NSString *croppedImageTag) {
      if (!croppedImageTag) {
        NSString *errorMessage = @"Error storing cropped image in ABI12_0_0RCTImageStoreManager";
        ABI12_0_0RCTLogWarn(@"%@", errorMessage);
        errorCallback(ABI12_0_0RCTErrorWithMessage(errorMessage));
        return;
      }
      successCallback(@[croppedImageTag]);
    }];
  }];
}

@end
