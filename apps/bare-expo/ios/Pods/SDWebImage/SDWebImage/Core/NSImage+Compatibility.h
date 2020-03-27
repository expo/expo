/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

#if SD_MAC

/**
 This category is provided to easily write cross-platform(AppKit/UIKit) code. For common usage, see `UIImage+Metadata.h`.
 */
@interface NSImage (Compatibility)

/**
The underlying Core Graphics image object. This will actually use `CGImageForProposedRect` with the image size.
 */
@property (nonatomic, readonly, nullable) CGImageRef CGImage;
/**
 The underlying Core Image data. This will actually use `bestRepresentationForRect` with the image size to find the `NSCIImageRep`.
 */
@property (nonatomic, readonly, nullable) CIImage *CIImage;
/**
 The scale factor of the image. This wil actually use `bestRepresentationForRect` with image size and pixel size to calculate the scale factor. If failed, use the default value 1.0. Should be greater than or equal to 1.0.
 */
@property (nonatomic, readonly) CGFloat scale;

// These are convenience methods to make AppKit's `NSImage` match UIKit's `UIImage` behavior. The scale factor should be greater than or equal to 1.0.

/**
 Returns an image object with the scale factor and orientation. The representation is created from the Core Graphics image object.
 @note The difference between this and `initWithCGImage:size` is that `initWithCGImage:size` will actually create a `NSCGImageSnapshotRep` representation and always use `backingScaleFactor` as scale factor. So we should avoid it and use `NSBitmapImageRep` with `initWithCGImage:` instead.
 @note The difference between this and UIKit's `UIImage` equivalent method is the way to process orientation. If the provided image orientation is not equal to Up orientation, this method will firstly rotate the CGImage to the correct orientation to work compatible with `NSImageView`. However, UIKit will not actually rotate CGImage and just store it as `imageOrientation` property.

 @param cgImage A Core Graphics image object
 @param scale The image scale factor
 @param orientation The orientation of the image data
 @return The image object
 */
- (nonnull instancetype)initWithCGImage:(nonnull CGImageRef)cgImage scale:(CGFloat)scale orientation:(CGImagePropertyOrientation)orientation;

/**
 Initializes and returns an image object with the specified Core Image object. The representation is `NSCIImageRep`.
 
 @param ciImage A Core Image image object
 @param scale The image scale factor
 @param orientation The orientation of the image data
 @return The image object
 */
- (nonnull instancetype)initWithCIImage:(nonnull CIImage *)ciImage scale:(CGFloat)scale orientation:(CGImagePropertyOrientation)orientation;

/**
 Returns an image object with the scale factor. The representation is created from the image data.
 @note The difference between these this and `initWithData:` is that `initWithData:` will always use `backingScaleFactor` as scale factor.

 @param data The image data
 @param scale The image scale factor
 @return The image object
 */
- (nullable instancetype)initWithData:(nonnull NSData *)data scale:(CGFloat)scale;

@end

#endif
