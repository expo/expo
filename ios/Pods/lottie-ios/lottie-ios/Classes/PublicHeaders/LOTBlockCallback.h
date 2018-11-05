//
//  LOTBlockCallback.h
//  Lottie
//
//  Created by brandon_withrow on 12/15/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import "LOTValueDelegate.h"

/*!
 @brief A block that is used to change a Color value at keytime, the block is called continuously for a keypath while the aniamtion plays.
 @param currentFrame The current frame of the animation in the parent compositions time space.
 @param startKeyFrame When the block is called, startFrame is the most recent keyframe for the keypath in relation to the current time.
 @param endKeyFrame When the block is called, endFrame is the next keyframe for the keypath in relation to the current time.
 @param interpolatedProgress A value from 0-1 that represents the current progress between keyframes. It respects the keyframes current easing curves.
 @param startColor The color from the previous keyframe in relation to the current time.
 @param endColor The color from the next keyframe in relation to the current time.
 @param interpolatedColor The color interpolated at the current time between startColor and endColor. This represents the keypaths current color for the current time.
 @return CGColorRef the color to set the keypath node for the current frame
 */
typedef CGColorRef _Nonnull (^LOTColorValueCallbackBlock)(CGFloat currentFrame,
                                                          CGFloat startKeyFrame,
                                                          CGFloat endKeyFrame,
                                                          CGFloat interpolatedProgress,
                                                          CGColorRef _Nullable startColor,
                                                          CGColorRef _Nullable endColor,
                                                          CGColorRef _Nullable interpolatedColor);

/*!
 @brief A block that is used to change a Number value at keytime, the block is called continuously for a keypath while the aniamtion plays.
 @param currentFrame The current frame of the animation in the parent compositions time space.
 @param startKeyFrame When the block is called, startFrame is the most recent keyframe for the keypath in relation to the current time.
 @param endKeyFrame When the block is called, endFrame is the next keyframe for the keypath in relation to the current time.
 @param interpolatedProgress A value from 0-1 that represents the current progress between keyframes. It respects the keyframes current easing curves.
 @param startValue The Number from the previous keyframe in relation to the current time.
 @param endValue The Number from the next keyframe in relation to the current time.
 @param interpolatedValue The Number interpolated at the current time between startValue and endValue. This represents the keypaths current Number for the current time.
 @return CGFloat the number to set the keypath node for the current frame
 */
typedef CGFloat (^LOTNumberValueCallbackBlock)(CGFloat currentFrame,
                                               CGFloat startKeyFrame,
                                               CGFloat endKeyFrame,
                                               CGFloat interpolatedProgress,
                                               CGFloat startValue,
                                               CGFloat endValue,
                                               CGFloat interpolatedValue);
/*!
 @brief A block that is used to change a Point value at keytime, the block is called continuously for a keypath while the aniamtion plays.
 @param currentFrame The current frame of the animation in the parent compositions time space.
 @param startKeyFrame When the block is called, startFrame is the most recent keyframe for the keypath in relation to the current time.
 @param endKeyFrame When the block is called, endFrame is the next keyframe for the keypath in relation to the current time.
 @param interpolatedProgress A value from 0-1 that represents the current progress between keyframes. It respects the keyframes current easing curves.
 @param startPoint The Point from the previous keyframe in relation to the current time.
 @param endPoint The Point from the next keyframe in relation to the current time.
 @param interpolatedPoint The Point interpolated at the current time between startPoint and endPoint. This represents the keypaths current Point for the current time.
 @return CGPoint the point to set the keypath node for the current frame.
 */
typedef CGPoint (^LOTPointValueCallbackBlock)(CGFloat currentFrame,
                                              CGFloat startKeyFrame,
                                              CGFloat endKeyFrame,
                                              CGFloat interpolatedProgress,
                                              CGPoint startPoint,
                                              CGPoint endPoint,
                                              CGPoint interpolatedPoint);

/*!
 @brief A block that is used to change a Size value at keytime, the block is called continuously for a keypath while the aniamtion plays.
 @param currentFrame The current frame of the animation in the parent compositions time space.
 @param startKeyFrame When the block is called, startFrame is the most recent keyframe for the keypath in relation to the current time.
 @param endKeyFrame When the block is called, endFrame is the next keyframe for the keypath in relation to the current time.
 @param interpolatedProgress A value from 0-1 that represents the current progress between keyframes. It respects the keyframes current easing curves.
 @param startSize The Size from the previous keyframe in relation to the current time.
 @param endSize The Size from the next keyframe in relation to the current time.
 @param interpolatedSize The Size interpolated at the current time between startSize and endSize. This represents the keypaths current Size for the current time.
 @return CGSize the size to set the keypath node for the current frame.
 */
typedef CGSize (^LOTSizeValueCallbackBlock)(CGFloat currentFrame,
                                            CGFloat startKeyFrame,
                                            CGFloat endKeyFrame,
                                            CGFloat interpolatedProgress,
                                            CGSize startSize,
                                            CGSize endSize,
                                            CGSize interpolatedSize);

/*!
 @brief A block that is used to change a Path value at keytime, the block is called continuously for a keypath while the aniamtion plays.
 @param currentFrame The current frame of the animation in the parent compositions time space.
 @param startKeyFrame When the block is called, startFrame is the most recent keyframe for the keypath in relation to the current time.
 @param endKeyFrame When the block is called, endFrame is the next keyframe for the keypath in relation to the current time.
 @param interpolatedProgress A value from 0-1 that represents the current progress between keyframes. It respects the keyframes current easing curves.
 @return UIBezierPath the path to set the keypath node for the current frame.
 */
typedef CGPathRef  _Nonnull (^LOTPathValueCallbackBlock)(CGFloat currentFrame,
                                                         CGFloat startKeyFrame,
                                                         CGFloat endKeyFrame,
                                                         CGFloat interpolatedProgress);

/*!
 @brief LOTColorValueCallback is wrapper around a LOTColorValueCallbackBlock. This block can be used in conjunction with LOTAnimationView setValueDelegate:forKeypath to dynamically change an animation's color keypath at runtime.
 */

@interface LOTColorBlockCallback : NSObject <LOTColorValueDelegate>

+ (instancetype _Nonnull)withBlock:(LOTColorValueCallbackBlock _Nonnull )block NS_SWIFT_NAME(init(block:));

@property (nonatomic, copy, nonnull) LOTColorValueCallbackBlock callback;

@end

/*!
 @brief LOTNumberValueCallback is wrapper around a LOTNumberValueCallbackBlock. This block can be used in conjunction with LOTAnimationView setValueDelegate:forKeypath to dynamically change an animation's number keypath at runtime.
 */

@interface LOTNumberBlockCallback : NSObject <LOTNumberValueDelegate>

+ (instancetype _Nonnull)withBlock:(LOTNumberValueCallbackBlock _Nonnull)block NS_SWIFT_NAME(init(block:));

@property (nonatomic, copy, nonnull) LOTNumberValueCallbackBlock callback;

@end

/*!
 @brief LOTPointValueCallback is wrapper around a LOTPointValueCallbackBlock. This block can be used in conjunction with LOTAnimationView setValueDelegate:forKeypath to dynamically change an animation's point keypath at runtime.
 */

@interface LOTPointBlockCallback : NSObject <LOTPointValueDelegate>

+ (instancetype _Nonnull)withBlock:(LOTPointValueCallbackBlock _Nonnull)block NS_SWIFT_NAME(init(block:));

@property (nonatomic, copy, nonnull) LOTPointValueCallbackBlock callback;

@end

/*!
 @brief LOTSizeValueCallback is wrapper around a LOTSizeValueCallbackBlock. This block can be used in conjunction with LOTAnimationView setValueDelegate:forKeypath to dynamically change an animation's size keypath at runtime.
 */

@interface LOTSizeBlockCallback : NSObject <LOTSizeValueDelegate>

+ (instancetype _Nonnull)withBlock:(LOTSizeValueCallbackBlock _Nonnull)block NS_SWIFT_NAME(init(block:));

@property (nonatomic, copy, nonnull) LOTSizeValueCallbackBlock callback;

@end

/*!
 @brief LOTPathValueCallback is wrapper around a LOTPathValueCallbackBlock. This block can be used in conjunction with LOTAnimationView setValueDelegate:forKeypath to dynamically change an animation's path keypath at runtime.
 */

@interface LOTPathBlockCallback : NSObject <LOTPathValueDelegate>

+ (instancetype _Nonnull)withBlock:(LOTPathValueCallbackBlock _Nonnull)block NS_SWIFT_NAME(init(block:));

@property (nonatomic, copy, nonnull) LOTPathValueCallbackBlock callback;

@end

