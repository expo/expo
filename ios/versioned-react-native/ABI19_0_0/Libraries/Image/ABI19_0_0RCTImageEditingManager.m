/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTImageEditingManager.h"

#import <UIKit/UIKit.h>

#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTLog.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>

#import "ABI19_0_0RCTImageLoader.h"
#import "ABI19_0_0RCTImageStoreManager.h"
#import "ABI19_0_0RCTImageUtils.h"

@implementation ABI19_0_0RCTImageEditingManager

ABI19_0_0RCT_EXPORT_MODULE()

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
ABI19_0_0RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(NSDictionary *)cropData
                  successCallback:(ABI19_0_0RCTResponseSenderBlock)successCallback
                  errorCallback:(ABI19_0_0RCTResponseErrorBlock)errorCallback)
{
  CGRect rect = {
    [ABI19_0_0RCTConvert CGPoint:cropData[@"offset"]],
    [ABI19_0_0RCTConvert CGSize:cropData[@"size"]]
  };

  [_bridge.imageLoader loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
    if (error) {
      errorCallback(error);
      return;
    }

    // Crop image
    CGSize targetSize = rect.size;
    CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
    CGAffineTransform transform = ABI19_0_0RCTTransformFromTargetRect(image.size, targetRect);
    UIImage *croppedImage = ABI19_0_0RCTTransformImage(image, targetSize, image.scale, transform);

    // Scale image
    if (cropData[@"displaySize"]) {
      targetSize = [ABI19_0_0RCTConvert CGSize:cropData[@"displaySize"]]; // in pixels
      ABI19_0_0RCTResizeMode resizeMode = [ABI19_0_0RCTConvert ABI19_0_0RCTResizeMode:cropData[@"resizeMode"] ?: @"contain"];
      targetRect = ABI19_0_0RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
      transform = ABI19_0_0RCTTransformFromTargetRect(croppedImage.size, targetRect);
      croppedImage = ABI19_0_0RCTTransformImage(croppedImage, targetSize, image.scale, transform);
    }

    // Store image
    [self->_bridge.imageStoreManager storeImage:croppedImage withBlock:^(NSString *croppedImageTag) {
      if (!croppedImageTag) {
        NSString *errorMessage = @"Error storing cropped image in ABI19_0_0RCTImageStoreManager";
        ABI19_0_0RCTLogWarn(@"%@", errorMessage);
        errorCallback(ABI19_0_0RCTErrorWithMessage(errorMessage));
        return;
      }
      successCallback(@[croppedImageTag]);
    }];
  }];
}

@end
