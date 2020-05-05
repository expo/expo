/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 * (c) Fabrice Aneche
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"

/**
 You can use switch case like normal enum. It's also recommended to add a default case. You should not assume anything about the raw value.
 For custom coder plugin, it can also extern the enum for supported format. See `SDImageCoder` for more detailed information.
 */
typedef NSInteger SDImageFormat NS_TYPED_EXTENSIBLE_ENUM;
static const SDImageFormat SDImageFormatUndefined = -1;
static const SDImageFormat SDImageFormatJPEG      = 0;
static const SDImageFormat SDImageFormatPNG       = 1;
static const SDImageFormat SDImageFormatGIF       = 2;
static const SDImageFormat SDImageFormatTIFF      = 3;
static const SDImageFormat SDImageFormatWebP      = 4;
static const SDImageFormat SDImageFormatHEIC      = 5;
static const SDImageFormat SDImageFormatHEIF      = 6;
static const SDImageFormat SDImageFormatPDF       = 7;
static const SDImageFormat SDImageFormatSVG       = 8;

/**
 NSData category about the image content type and UTI.
 */
@interface NSData (ImageContentType)

/**
 *  Return image format
 *
 *  @param data the input image data
 *
 *  @return the image format as `SDImageFormat` (enum)
 */
+ (SDImageFormat)sd_imageFormatForImageData:(nullable NSData *)data;

/**
 *  Convert SDImageFormat to UTType
 *
 *  @param format Format as SDImageFormat
 *  @return The UTType as CFStringRef
 */
+ (nonnull CFStringRef)sd_UTTypeFromImageFormat:(SDImageFormat)format CF_RETURNS_NOT_RETAINED NS_SWIFT_NAME(sd_UTType(from:));

/**
 *  Convert UTTyppe to SDImageFormat
 *
 *  @param uttype The UTType as CFStringRef
 *  @return The Format as SDImageFormat
 */
+ (SDImageFormat)sd_imageFormatFromUTType:(nonnull CFStringRef)uttype;

@end
