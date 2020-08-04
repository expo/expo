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
 Built in coder using ImageIO that supports animated GIF encoding/decoding
 @note `SDImageIOCoder` supports GIF but only as static (will use the 1st frame).
 @note Use `SDImageGIFCoder` for fully animated GIFs. For `UIImageView`, it will produce animated `UIImage`(`NSImage` on macOS) for rendering. For `SDAnimatedImageView`, it will use `SDAnimatedImage` for rendering.
 @note The recommended approach for animated GIFs is using `SDAnimatedImage` with `SDAnimatedImageView`. It's more performant than `UIImageView` for GIF displaying(especially on memory usage)
 */
@interface SDImageGIFCoder : SDImageIOAnimatedCoder <SDProgressiveImageCoder, SDAnimatedImageCoder>

@property (nonatomic, class, readonly, nonnull) SDImageGIFCoder *sharedCoder;

@end
