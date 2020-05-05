/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import <Foundation/Foundation.h>
#import "SDImageIOAnimatedCoder.h"

/**
 This coder is used for HEIC (HEIF with HEVC container codec) image format.
 Image/IO provide the static HEIC (.heic) support in iOS 11/macOS 10.13/tvOS 11/watchOS 4+.
 Image/IO provide the animated HEIC (.heics) support in iOS 13/macOS 10.15/tvOS 13/watchOS 6+.
 See https://nokiatech.github.io/heif/technical.html for the standard.
 @note This coder is not in the default coder list for now, since HEIC animated image is really rare, and Apple's implementation still contains performance issues. You can enable if you need this.
 @note If you need to support lower firmware version for HEIF, you can have a try at https://github.com/SDWebImage/SDWebImageHEIFCoder
 */
@interface SDImageHEICCoder : SDImageIOAnimatedCoder <SDProgressiveImageCoder, SDAnimatedImageCoder>

@property (nonatomic, class, readonly, nonnull) SDImageHEICCoder *sharedCoder;

@end
