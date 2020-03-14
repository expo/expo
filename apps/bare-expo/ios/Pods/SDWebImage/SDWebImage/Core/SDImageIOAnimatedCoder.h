/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import <Foundation/Foundation.h>
#import <ImageIO/ImageIO.h>
#import "SDImageCoder.h"

/**
 This is the abstract class for all animated coder, which use the Image/IO API. You can not use this directly as real coders. A exception will be raised if you use this class.
 All of the properties need the subclass to implment and works as expceted.
 For Image/IO, See Apple's documentation: https://developer.apple.com/documentation/imageio
 */
@interface SDImageIOAnimatedCoder : NSObject <SDProgressiveImageCoder, SDAnimatedImageCoder>

#pragma mark - Subclass Override
/**
 The supported animated image format. Such as `SDImageFormatGIF`.
 @note Subclass override.
 */
@property (class, readonly) SDImageFormat imageFormat;
/**
 The supported image format UTI Type. Such as `kUTTypeGIF`.
 This can be used for cases when we can not detect `SDImageFormat. Such as progressive decoding's hint format `kCGImageSourceTypeIdentifierHint`.
 @note Subclass override.
 */
@property (class, readonly, nonnull) NSString *imageUTType;
/**
 The image container property key used in Image/IO API. Such as `kCGImagePropertyGIFDictionary`.
 @note Subclass override.
 */
@property (class, readonly, nonnull) NSString *dictionaryProperty;
/**
 The image unclamped deply time property key used in Image/IO  API. Such as `kCGImagePropertyGIFUnclampedDelayTime`
 @note Subclass override.
 */
@property (class, readonly, nonnull) NSString *unclampedDelayTimeProperty;
/**
 The image delay time property key used in Image/IO API. Such as `kCGImagePropertyGIFDelayTime`.
 @note Subclass override.
 */
@property (class, readonly, nonnull) NSString *delayTimeProperty;
/**
 The image loop count property key used in Image/IO API. Such as `kCGImagePropertyGIFLoopCount`.
 @note Subclass override.
 */
@property (class, readonly, nonnull) NSString *loopCountProperty;
/**
 The default loop count when there are no any loop count information inside image container metadata.
 For example, for GIF format, the standard use 1 (play once). For APNG format, the standard use 0 (infinity loop).
 @note Subclass override.
 */
@property (class, readonly) NSUInteger defaultLoopCount;

@end
