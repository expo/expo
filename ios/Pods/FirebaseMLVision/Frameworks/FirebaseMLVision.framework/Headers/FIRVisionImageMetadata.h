#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionDetectorImageOrientation
 * This enum specifies where the origin (0,0) of the image is located. The constant has the same
 * value as defined by EXIF specifications.
 */
typedef NS_ENUM(NSUInteger, FIRVisionDetectorImageOrientation) {
  /**
   * Orientation code indicating the 0th row is the top and the 0th column is the left side.
   */
  FIRVisionDetectorImageOrientationTopLeft = 1,
  /**
   * Orientation code indicating the 0th row is the top and the 0th column is the right side.
   */
  FIRVisionDetectorImageOrientationTopRight,
  /**
   * Orientation code indicating the 0th row is the bottom and the 0th column is the right side.
   */
  FIRVisionDetectorImageOrientationBottomRight,
  /**
   * Orientation code indicating the 0th row is the bottom and the 0th column is the left side.
   */
  FIRVisionDetectorImageOrientationBottomLeft,
  /**
   * Orientation code indicating the 0th row is the left side and the 0th column is the top.
   */
  FIRVisionDetectorImageOrientationLeftTop,
  /**
   * Orientation code indicating the 0th row is the right side and the 0th column is the top.
   */
  FIRVisionDetectorImageOrientationRightTop,
  /**
   * Orientation code indicating the 0th row is the right side and the 0th column is the bottom.
   */
  FIRVisionDetectorImageOrientationRightBottom,
  /**
   * Orientation code indicating the 0th row is the left side and the 0th column is the
   * bottom.
   */
  FIRVisionDetectorImageOrientationLeftBottom,
} NS_SWIFT_NAME(VisionDetectorImageOrientation);

/**
 * Metadata of an image used in feature detection.
 */
NS_SWIFT_NAME(VisionImageMetadata)
@interface FIRVisionImageMetadata : NSObject

/**
 * The display orientation of the image. Defaults to `.topLeft`.
 */
@property(nonatomic) FIRVisionDetectorImageOrientation orientation;

@end

NS_ASSUME_NONNULL_END
