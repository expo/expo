#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionFaceDetectorClassificationMode
 * Classification mode for face detection.
 */
typedef NS_ENUM(NSUInteger, FIRVisionFaceDetectorClassificationMode) {
  /** Face classification mode indicating that the detector performs no classification. */
  FIRVisionFaceDetectorClassificationModeNone = 1,
  /** Face classification mode indicating that the detector performs all classifications. */
  FIRVisionFaceDetectorClassificationModeAll,
} NS_SWIFT_NAME(VisionFaceDetectorClassificationMode);

/**
 * @enum VisionFaceDetectorPerformanceMode
 * Performance preference for accuracy or speed of face detection.
 */
typedef NS_ENUM(NSUInteger, FIRVisionFaceDetectorPerformanceMode) {
  /**
   * Face detection performance mode that runs faster, but may detect fewer faces and/or return
   * results with lower accuracy.
   */
  FIRVisionFaceDetectorPerformanceModeFast = 1,
  /**
   * Face detection performance mode that runs slower, but may detect more faces and/or return
   * results with higher accuracy.
   */
  FIRVisionFaceDetectorPerformanceModeAccurate,
} NS_SWIFT_NAME(VisionFaceDetectorPerformanceMode);

/**
 * @enum VisionFaceDetectorLandmarkMode
 * Landmark detection mode for face detection.
 */
typedef NS_ENUM(NSUInteger, FIRVisionFaceDetectorLandmarkMode) {
  /** Face landmark mode indicating that the detector performs no landmark detection. */
  FIRVisionFaceDetectorLandmarkModeNone = 1,
  /** Face landmark mode indicating that the detector performs landmark detection. */
  FIRVisionFaceDetectorLandmarkModeAll,
} NS_SWIFT_NAME(VisionFaceDetectorLandmarkMode);

/**
 * @enum VisionFaceDetectorContourMode
 * Contour detection mode for face detection.
 */
typedef NS_ENUM(NSUInteger, FIRVisionFaceDetectorContourMode) {
  /** Face contour mode indicating that the detector performs no contour detection. */
  FIRVisionFaceDetectorContourModeNone = 1,
  /** Face contour mode indicating that the detector performs contour detection. */
  FIRVisionFaceDetectorContourModeAll,
} NS_SWIFT_NAME(VisionFaceDetectorContourMode);

/** Options for specifying a face detector. */
NS_SWIFT_NAME(VisionFaceDetectorOptions)
@interface FIRVisionFaceDetectorOptions : NSObject

/**
 * The face detector classification mode for characterizing attributes such as smiling. Defaults to
 * `.none`.
 */
@property(nonatomic) FIRVisionFaceDetectorClassificationMode classificationMode;

/**
 * The face detector performance mode that determines the accuracy of the results and the speed of
 * the detection. Defaults to `.fast`.
 */
@property(nonatomic) FIRVisionFaceDetectorPerformanceMode performanceMode;

/**
 * The face detector landmark mode that determines the type of landmark results returned by
 * detection. Defaults to `.none`.
 */
@property(nonatomic) FIRVisionFaceDetectorLandmarkMode landmarkMode;

/**
 * The face detector contour mode that determines the type of contour results returned by detection.
 * Defaults to `.none`.
 *
 * <p>The following detection results are returned when setting this mode to `.all`:
 *
 * <p>`performanceMode` set to `.fast`, and both `classificationMode` and `landmarkMode` set to
 * `.none`, then only the prominent face will be returned with detected contours.
 *
 * <p>`performanceMode` set to `.accurate`, or if `classificationMode` or `landmarkMode` is set to
 * `.all`, then all detected faces will be returned, but only the prominent face will have
 * detecteted contours.
 */
@property(nonatomic) FIRVisionFaceDetectorContourMode contourMode;

/**
 * The smallest desired face size. The size is expressed as a proportion of the width of the head to
 * the image width. For example, if a value of 0.1 is specified, then the smallest face to search
 * for is roughly 10% of the width of the image being searched. Defaults to 0.1. This option does
 * not apply to contour detection.
 */
@property(nonatomic) CGFloat minFaceSize;

/**
 * Whether the face tracking feature is enabled for face detection. Defaults to NO. When
 * `performanceMode` is set to `.fast`, and both `classificationMode` and `landmarkMode` set to
 * `.none`, this option will be ignored and tracking will be disabled.
 */
@property(nonatomic, getter=isTrackingEnabled) BOOL trackingEnabled;

@end

NS_ASSUME_NONNULL_END
