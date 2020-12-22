#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A 2D or 3D point in the image. A valid point must have both x and y coordinates. The point's
 * coordinates are in the same scale as the original image.
 */
NS_SWIFT_NAME(VisionPoint)
@interface FIRVisionPoint : NSObject

/** X coordinate. The value is float. */
@property(nonatomic, readonly) NSNumber *x;

/** Y coordinate. The value is float. */
@property(nonatomic, readonly) NSNumber *y;

/** Z coordinate (or depth). The value is float. Z is nil if it is a 2D point. */
@property(nonatomic, readonly, nullable) NSNumber *z;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

