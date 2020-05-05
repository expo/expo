/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"
#import <CoreGraphics/CoreGraphics.h>

/**
 These following graphics context method are provided to easily write cross-platform(AppKit/UIKit) code.
 For UIKit, these methods just call the same method in `UIGraphics.h`. See the documentation for usage.
 For AppKit, these methods use `NSGraphicsContext` to create image context and match the behavior like UIKit.
 @note If you don't care bitmap format (ARGB8888) and just draw image, use `SDGraphicsImageRenderer` instead. It's more performant on RAM usage.`
 */

/// Returns the current graphics context.
FOUNDATION_EXPORT CGContextRef __nullable SDGraphicsGetCurrentContext(void) CF_RETURNS_NOT_RETAINED;
/// Creates a bitmap-based graphics context and makes it the current context.
FOUNDATION_EXPORT void SDGraphicsBeginImageContext(CGSize size);
/// Creates a bitmap-based graphics context with the specified options.
FOUNDATION_EXPORT void SDGraphicsBeginImageContextWithOptions(CGSize size, BOOL opaque, CGFloat scale);
/// Removes the current bitmap-based graphics context from the top of the stack.
FOUNDATION_EXPORT void SDGraphicsEndImageContext(void);
/// Returns an image based on the contents of the current bitmap-based graphics context.
FOUNDATION_EXPORT UIImage * __nullable SDGraphicsGetImageFromCurrentImageContext(void);
