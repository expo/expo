#import <Foundation/Foundation.h>

@class FIRVisionPoint;

NS_ASSUME_NONNULL_BEGIN

/**
 * Facial contour types.
 */
typedef NSString *FIRFaceContourType NS_EXTENSIBLE_STRING_ENUM NS_SWIFT_NAME(FaceContourType);

/** All contour points including left and right cheeks. */
extern FIRFaceContourType const FIRFaceContourTypeAll;

/** A set of points that outline the face oval. */
extern FIRFaceContourType const FIRFaceContourTypeFace;

/** A set of points that outline the top of the left eyebrow. */
extern FIRFaceContourType const FIRFaceContourTypeLeftEyebrowTop;

/** A set of points that outline the bottom of the left eyebrow. */
extern FIRFaceContourType const FIRFaceContourTypeLeftEyebrowBottom;

/** A set of points that outline the top of the right eyebrow. */
extern FIRFaceContourType const FIRFaceContourTypeRightEyebrowTop;

/** A set of points that outline the bottom of the right eyebrow. */
extern FIRFaceContourType const FIRFaceContourTypeRightEyebrowBottom;

/** A set of points that outline the left eye. */
extern FIRFaceContourType const FIRFaceContourTypeLeftEye;

/** A set of points that outline the right eye. */
extern FIRFaceContourType const FIRFaceContourTypeRightEye;

/** A set of points that outline the top of the upper lip. */
extern FIRFaceContourType const FIRFaceContourTypeUpperLipTop;

/** A set of points that outline the bottom of the upper lip. */
extern FIRFaceContourType const FIRFaceContourTypeUpperLipBottom;

/** A set of points that outline the top of the lower lip. */
extern FIRFaceContourType const FIRFaceContourTypeLowerLipTop;

/** A set of points that outline the bottom of the lower lip. */
extern FIRFaceContourType const FIRFaceContourTypeLowerLipBottom;

/** A set of points that outline the nose bridge. */
extern FIRFaceContourType const FIRFaceContourTypeNoseBridge;

/** A set of points that outline the bottom of the nose. */
extern FIRFaceContourType const FIRFaceContourTypeNoseBottom;

/**
 * A contour on a human face detected in an image.
 */
NS_SWIFT_NAME(VisionFaceContour)
@interface FIRVisionFaceContour : NSObject

/**
 * The facial contour type.
 */
@property(nonatomic, readonly) FIRFaceContourType type;

/**
 * An array of 2D points that make up the facial contour.
 */
@property(nonatomic, readonly) NSArray<FIRVisionPoint *> *points;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
