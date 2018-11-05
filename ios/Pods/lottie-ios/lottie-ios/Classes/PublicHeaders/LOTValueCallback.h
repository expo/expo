//
//  LOTValueCallback.h
//  Lottie
//
//  Created by brandon_withrow on 12/15/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import "LOTValueDelegate.h"

/*!
 @brief LOTColorValueCallback is a container for a CGColorRef. This container is a LOTColorValueDelegate that always returns the colorValue property to its animation delegate.
 @discussion LOTColorValueCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeypath to set a color value of an animation property.
 */

@interface LOTColorValueCallback : NSObject <LOTColorValueDelegate>

+ (instancetype _Nonnull)withCGColor:(CGColorRef _Nonnull)color NS_SWIFT_NAME(init(color:));

@property (nonatomic, nonnull) CGColorRef colorValue;

@end

/*!
 @brief LOTNumberValueCallback is a container for a CGFloat value. This container is a LOTNumberValueDelegate that always returns the numberValue property to its animation delegate.
 @discussion LOTNumberValueCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeypath to set a number value of an animation property.
 */

@interface LOTNumberValueCallback : NSObject <LOTNumberValueDelegate>

+ (instancetype _Nonnull)withFloatValue:(CGFloat)numberValue NS_SWIFT_NAME(init(number:));

@property (nonatomic, assign) CGFloat numberValue;

@end

/*!
 @brief LOTPointValueCallback is a container for a CGPoint value. This container is a LOTPointValueDelegate that always returns the pointValue property to its animation delegate.
 @discussion LOTPointValueCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeypath to set a point value of an animation property.
 */

@interface LOTPointValueCallback : NSObject <LOTPointValueDelegate>

+ (instancetype _Nonnull)withPointValue:(CGPoint)pointValue;

@property (nonatomic, assign) CGPoint pointValue;

@end

/*!
 @brief LOTSizeValueCallback is a container for a CGSize value. This container is a LOTSizeValueDelegate that always returns the sizeValue property to its animation delegate.
 @discussion LOTSizeValueCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeypath to set a size value of an animation property.
 */

@interface LOTSizeValueCallback : NSObject <LOTSizeValueDelegate>

+ (instancetype _Nonnull)withPointValue:(CGSize)sizeValue NS_SWIFT_NAME(init(size:));

@property (nonatomic, assign) CGSize sizeValue;

@end

/*!
 @brief LOTPathValueCallback is a container for a CGPathRef value. This container is a LOTPathValueDelegate that always returns the pathValue property to its animation delegate.
 @discussion LOTPathValueCallback is used in conjunction with LOTAnimationView setValueDelegate:forKeypath to set a path value of an animation property.
 */

@interface LOTPathValueCallback : NSObject <LOTPathValueDelegate>

+ (instancetype _Nonnull)withCGPath:(CGPathRef _Nonnull)path NS_SWIFT_NAME(init(path:));

@property (nonatomic, nonnull) CGPathRef pathValue;

@end
