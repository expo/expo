/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"
#import "NSData+ImageContentType.h"

/**
 UIImage category for convenient image format decoding/encoding.
 */
@interface UIImage (MultiFormat)
#pragma mark - Decode
/**
 Create and decode a image with the specify image data

 @param data The image data
 @return The created image
 */
+ (nullable UIImage *)sd_imageWithData:(nullable NSData *)data;

/**
 Create and decode a image with the specify image data and scale
 
 @param data The image data
 @param scale The image scale factor. Should be greater than or equal to 1.0.
 @return The created image
 */
+ (nullable UIImage *)sd_imageWithData:(nullable NSData *)data scale:(CGFloat)scale;

/**
 Create and decode a image with the specify image data and scale, allow specify animate/static control
 
 @param data The image data
 @param scale The image scale factor. Should be greater than or equal to 1.0.
 @param firstFrameOnly Even if the image data is animated image format, decode the first frame only as static image.
 @return The created image
 */
+ (nullable UIImage *)sd_imageWithData:(nullable NSData *)data scale:(CGFloat)scale firstFrameOnly:(BOOL)firstFrameOnly;

#pragma mark - Encode
/**
 Encode the current image to the data, the image format is unspecified

 @return The encoded data. If can't encode, return nil
 */
- (nullable NSData *)sd_imageData;

/**
 Encode the current image to data with the specify image format

 @param imageFormat The specify image format
 @return The encoded data. If can't encode, return nil
 */
- (nullable NSData *)sd_imageDataAsFormat:(SDImageFormat)imageFormat NS_SWIFT_NAME(sd_imageData(as:));

/**
 Encode the current image to data with the specify image format and compression quality

 @param imageFormat The specify image format
 @param compressionQuality The quality of the resulting image data. Value between 0.0-1.0. Some coders may not support compression quality.
 @return The encoded data. If can't encode, return nil
 */
- (nullable NSData *)sd_imageDataAsFormat:(SDImageFormat)imageFormat compressionQuality:(double)compressionQuality NS_SWIFT_NAME(sd_imageData(as:compressionQuality:));

/**
 Encode the current image to data with the specify image format and compression quality, allow specify animate/static control
 
 @param imageFormat The specify image format
 @param compressionQuality The quality of the resulting image data. Value between 0.0-1.0. Some coders may not support compression quality.
 @param firstFrameOnly Even if the image is animated image, encode the first frame only as static image.
 @return The encoded data. If can't encode, return nil
 */
- (nullable NSData *)sd_imageDataAsFormat:(SDImageFormat)imageFormat compressionQuality:(double)compressionQuality firstFrameOnly:(BOOL)firstFrameOnly NS_SWIFT_NAME(sd_imageData(as:compressionQuality:firstFrameOnly:));

@end
