//
//  LOTInterpolatorCallback.h
//  Lottie
//
//  Created by brandon_withrow on 12/15/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import "LOTValueDelegate.h"

/*!
 @brief LOTPointInterpolatorCallback is a container for a CGPointRef. This container is a LOTPointValueDelegate that will return the point interpolated at currentProgress between fromPoint and toPoint. Externally changing currentProgress will change the point of the animation.
 @discussion LOTPointInterpolatorCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeypoint to set a point value of an animation property.
 */

@interface LOTPointInterpolatorCallback : NSObject <LOTPointValueDelegate>

+ (instancetype _Nonnull)withFromPoint:(CGPoint)fromPoint toPoint:(CGPoint)toPoint NS_SWIFT_NAME(init(from:to:));

@property (nonatomic) CGPoint fromPoint;
@property (nonatomic) CGPoint toPoint;

/*!
 @brief As currentProgess changes from 0 to 1 the point sent to the animation view is interpolated between fromPoint and toPoint.
 */

@property (nonatomic, assign) CGFloat currentProgress;

@end

/*!
 @brief LOTSizeInterpolatorCallback is a container for a CGSizeRef. This container is a LOTSizeValueDelegate that will return the size interpolated at currentProgress between fromSize and toSize. Externally changing currentProgress will change the size of the animation.
 @discussion LOTSizeInterpolatorCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeysize to set a size value of an animation property.
 */

@interface LOTSizeInterpolatorCallback : NSObject <LOTSizeValueDelegate>

+ (instancetype _Nonnull)withFromSize:(CGSize)fromSize toSize:(CGSize)toSize NS_SWIFT_NAME(init(from:to:));

@property (nonatomic) CGSize fromSize;
@property (nonatomic) CGSize toSize;

/*!
 @brief As currentProgess changes from 0 to 1 the size sent to the animation view is interpolated between fromSize and toSize.
 */

@property (nonatomic, assign) CGFloat currentProgress;

@end

/*!
 @brief LOTFloatInterpolatorCallback is a container for a CGFloatRef. This container is a LOTFloatValueDelegate that will return the float interpolated at currentProgress between fromFloat and toFloat. Externally changing currentProgress will change the float of the animation.
 @discussion LOTFloatInterpolatorCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeyfloat to set a float value of an animation property.
 */

@interface LOTFloatInterpolatorCallback : NSObject <LOTNumberValueDelegate>

+ (instancetype _Nonnull)withFromFloat:(CGFloat)fromFloat toFloat:(CGFloat)toFloat NS_SWIFT_NAME(init(from:to:));

@property (nonatomic) CGFloat fromFloat;
@property (nonatomic) CGFloat toFloat;

/*!
 @brief As currentProgess changes from 0 to 1 the float sent to the animation view is interpolated between fromFloat and toFloat.
 */

@property (nonatomic, assign) CGFloat currentProgress;

@end
