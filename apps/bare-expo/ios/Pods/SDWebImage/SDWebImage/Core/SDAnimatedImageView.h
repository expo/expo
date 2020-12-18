/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

#if SD_UIKIT || SD_MAC

#import "SDAnimatedImage.h"
#import "SDAnimatedImagePlayer.h"

/**
 A drop-in replacement for UIImageView/NSImageView, you can use this for animated image rendering.
 Call `setImage:` with `UIImage(NSImage)` which conforms to `SDAnimatedImage` protocol will start animated image rendering. Call with normal UIImage(NSImage) will back to normal UIImageView(NSImageView) rendering
 For UIKit: use `-startAnimating`, `-stopAnimating` to control animating. `isAnimating` to check animation state.
 For AppKit: use `-setAnimates:` to control animating, `animates` to check animation state. This view is layer-backed.
 */
@interface SDAnimatedImageView : UIImageView
/**
 The internal animation player.
 This property is only used for advanced usage, like inspecting/debugging animation status, control progressive loading, complicated animation frame index control, etc.
 @warning Pay attention if you directly update the player's property like `totalFrameCount`, `totalLoopCount`, the same property on `SDAnimatedImageView` may not get synced.
 */
@property (nonatomic, strong, readonly, nullable) SDAnimatedImagePlayer *player;

/**
 Current display frame image. This value is KVO Compliance.
 */
@property (nonatomic, strong, readonly, nullable) UIImage *currentFrame;
/**
 Current frame index, zero based. This value is KVO Compliance.
 */
@property (nonatomic, assign, readonly) NSUInteger currentFrameIndex;
/**
 Current loop count since its latest animating. This value is KVO Compliance.
 */
@property (nonatomic, assign, readonly) NSUInteger currentLoopCount;
/**
 YES to choose `animationRepeatCount` property for animation loop count. No to use animated image's `animatedImageLoopCount` instead.
 Default is NO.
 */
@property (nonatomic, assign) BOOL shouldCustomLoopCount;
/**
 Total loop count for animated image rendering. Default is animated image's loop count.
 If you need to set custom loop count, set `shouldCustomLoopCount` to YES and change this value.
 This class override UIImageView's `animationRepeatCount` property on iOS, use this property as well.
 */
@property (nonatomic, assign) NSInteger animationRepeatCount;
/**
 The animation playback rate. Default is 1.0.
 `1.0` means the normal speed.
 `0.0` means stopping the animation.
 `0.0-1.0` means the slow speed.
 `> 1.0` means the fast speed.
 `< 0.0` is not supported currently and stop animation. (may support reverse playback in the future)
 */
@property (nonatomic, assign) double playbackRate;

/// Asynchronous setup animation playback mode. Default mode is SDAnimatedImagePlaybackModeNormal.
@property (nonatomic, assign) SDAnimatedImagePlaybackMode playbackMode;

/**
 Provide a max buffer size by bytes. This is used to adjust frame buffer count and can be useful when the decoding cost is expensive (such as Animated WebP software decoding). Default is 0.
 `0` means automatically adjust by calculating current memory usage.
 `1` means without any buffer cache, each of frames will be decoded and then be freed after rendering. (Lowest Memory and Highest CPU)
 `NSUIntegerMax` means cache all the buffer. (Lowest CPU and Highest Memory)
 */
@property (nonatomic, assign) NSUInteger maxBufferSize;
/**
 Whehter or not to enable incremental image load for animated image. This is for the animated image which `sd_isIncremental` is YES (See `UIImage+Metadata.h`). If enable, animated image rendering will stop at the last frame available currently, and continue when another `setImage:` trigger, where the new animated image's `animatedImageData` should be updated from the previous one. If the `sd_isIncremental` is NO. The incremental image load stop.
 @note If you are confused about this description, open Chrome browser to view some large GIF images with low network speed to see the animation behavior.
 @note The best practice to use incremental load is using `initWithAnimatedCoder:scale:` in `SDAnimatedImage` with animated coder which conform to `SDProgressiveImageCoder` as well. Then call incremental update and incremental decode method to produce the image.
 Default is YES. Set to NO to only render the static poster for incremental animated image.
 */
@property (nonatomic, assign) BOOL shouldIncrementalLoad;

/**
 Whether or not to clear the frame buffer cache when animation stopped. See `maxBufferSize`
 This is useful when you want to limit the memory usage during frequently visibility changes (such as image view inside a list view, then push and pop)
 Default is NO.
 */
@property (nonatomic, assign) BOOL clearBufferWhenStopped;

/**
 Whether or not to reset the current frame index when animation stopped.
 For some of use case, you may want to reset the frame index to 0 when stop, but some other want to keep the current frame index.
 Default is NO.
 */
@property (nonatomic, assign) BOOL resetFrameIndexWhenStopped;

/**
 If the image which conforms to `SDAnimatedImage` protocol has more than one frame, set this value to `YES` will automatically
 play/stop the animation when the view become visible/invisible.
 Default is YES.
 */
@property (nonatomic, assign) BOOL autoPlayAnimatedImage;

/**
 You can specify a runloop mode to let it rendering.
 Default is NSRunLoopCommonModes on multi-core device, NSDefaultRunLoopMode on single-core device
 @note This is useful for some cases, for example, always specify NSDefaultRunLoopMode, if you want to pause the animation when user scroll (for Mac user, drag the mouse or touchpad)
 */
@property (nonatomic, copy, nonnull) NSRunLoopMode runLoopMode;
@end

#endif
