/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

#if SD_UIKIT || SD_MAC

/**
 A protocol to custom the indicator during the image loading.
 All of these methods are called from main queue.
 */
@protocol SDWebImageIndicator <NSObject>

@required
/**
 The view associate to the indicator.

 @return The indicator view
 */
@property (nonatomic, strong, readonly, nonnull) UIView *indicatorView;

/**
 Start the animating for indicator.
 */
- (void)startAnimatingIndicator;

/**
 Stop the animating for indicator.
 */
- (void)stopAnimatingIndicator;

@optional
/**
 Update the loading progress (0-1.0) for indicator. Optional
 
 @param progress The progress, value between 0 and 1.0
 */
- (void)updateIndicatorProgress:(double)progress;

@end

#pragma mark - Activity Indicator

/**
 Activity indicator class.
 for UIKit(macOS), it use a `UIActivityIndicatorView`.
 for AppKit(macOS), it use a `NSProgressIndicator` with the spinning style.
 */
@interface SDWebImageActivityIndicator : NSObject <SDWebImageIndicator>

#if SD_UIKIT
@property (nonatomic, strong, readonly, nonnull) UIActivityIndicatorView *indicatorView;
#else
@property (nonatomic, strong, readonly, nonnull) NSProgressIndicator *indicatorView;
#endif

@end

/**
 Convenience way to use activity indicator.
 */
@interface SDWebImageActivityIndicator (Conveniences)

/// These indicator use the fixed color without dark mode support
/// gray-style activity indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageActivityIndicator *grayIndicator;
/// large gray-style activity indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageActivityIndicator *grayLargeIndicator;
/// white-style activity indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageActivityIndicator *whiteIndicator;
/// large white-style activity indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageActivityIndicator *whiteLargeIndicator;
/// These indicator use the system style, supports dark mode if available (iOS 13+/macOS 10.14+)
/// large activity indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageActivityIndicator *largeIndicator;
/// medium activity indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageActivityIndicator *mediumIndicator;

@end

#pragma mark - Progress Indicator

/**
 Progress indicator class.
 for UIKit(macOS), it use a `UIProgressView`.
 for AppKit(macOS), it use a `NSProgressIndicator` with the bar style.
 */
@interface SDWebImageProgressIndicator : NSObject <SDWebImageIndicator>

#if SD_UIKIT
@property (nonatomic, strong, readonly, nonnull) UIProgressView *indicatorView;
#else
@property (nonatomic, strong, readonly, nonnull) NSProgressIndicator *indicatorView;
#endif

@end

/**
 Convenience way to create progress indicator. Remember to specify the indicator width or use layout constraint if need.
 */
@interface SDWebImageProgressIndicator (Conveniences)

/// default-style progress indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageProgressIndicator *defaultIndicator;
/// bar-style progress indicator
@property (nonatomic, class, nonnull, readonly) SDWebImageProgressIndicator *barIndicator API_UNAVAILABLE(macos, tvos);

@end

#endif
