/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import "SDWebImageCompat.h"

/**
 These following class are provided to use `UIGraphicsImageRenderer` with polyfill, which allows write cross-platform(AppKit/UIKit) code and avoid runtime version check.
 Compared to `UIGraphicsBeginImageContext`, `UIGraphicsImageRenderer` use dynamic bitmap from your draw code to generate CGContext, not always use ARGB8888, which is more performant on RAM usage.
 Which means, if you draw CGImage/CIImage which contains grayscale only, the underlaying bitmap context use grayscale, it's managed by system and not a fixed type. (actually, the `kCGContextTypeAutomatic`)
 For usage, See more in Apple's documentation: https://developer.apple.com/documentation/uikit/uigraphicsimagerenderer
 For UIKit on iOS/tvOS 10+, these method just use the same `UIGraphicsImageRenderer` API.
 For others (macOS/watchOS or iOS/tvOS 10-), these method use the `SDImageGraphics.h` to implements the same behavior (but without dynamic bitmap support)
*/

typedef void (^SDGraphicsImageDrawingActions)(CGContextRef _Nonnull context);
typedef NS_ENUM(NSInteger, SDGraphicsImageRendererFormatRange) {
    SDGraphicsImageRendererFormatRangeUnspecified = -1,
    SDGraphicsImageRendererFormatRangeAutomatic = 0,
    SDGraphicsImageRendererFormatRangeExtended,
    SDGraphicsImageRendererFormatRangeStandard
};

/// A set of drawing attributes that represent the configuration of an image renderer context.
@interface SDGraphicsImageRendererFormat : NSObject

/// The display scale of the image renderer context.
/// The default value is equal to the scale of the main screen.
@property (nonatomic) CGFloat scale;

/// A Boolean value indicating whether the underlying Core Graphics context has an alpha channel.
/// The default value is NO.
@property (nonatomic) BOOL opaque;

/// Specifying whether the bitmap context should use extended color.
/// For iOS 12+, the value is from system `preferredRange` property
/// For iOS 10-11, the value is from system `prefersExtendedRange` property
/// For iOS 9-, the value is `.standard`
@property (nonatomic) SDGraphicsImageRendererFormatRange preferredRange;

/// Init the default format. See each properties's default value.
- (nonnull instancetype)init;

/// Returns a new format best suited for the main screen’s current configuration.
+ (nonnull instancetype)preferredFormat;

@end

/// A graphics renderer for creating Core Graphics-backed images.
@interface SDGraphicsImageRenderer : NSObject

/// Creates an image renderer for drawing images of a given size.
/// @param size The size of images output from the renderer, specified in points.
/// @return An initialized image renderer.
- (nonnull instancetype)initWithSize:(CGSize)size;

/// Creates a new image renderer with a given size and format.
/// @param size The size of images output from the renderer, specified in points.
/// @param format A SDGraphicsImageRendererFormat object that encapsulates the format used to create the renderer context.
/// @return An initialized image renderer.
- (nonnull instancetype)initWithSize:(CGSize)size format:(nonnull SDGraphicsImageRendererFormat *)format;

/// Creates an image by following a set of drawing instructions.
/// @param actions A SDGraphicsImageDrawingActions block that, when invoked by the renderer, executes a set of drawing instructions to create the output image.
/// @note You should not retain or use the context outside the block, it's non-escaping.
/// @return A UIImage object created by the supplied drawing actions.
- (nonnull UIImage *)imageWithActions:(nonnull NS_NOESCAPE SDGraphicsImageDrawingActions)actions;

@end
