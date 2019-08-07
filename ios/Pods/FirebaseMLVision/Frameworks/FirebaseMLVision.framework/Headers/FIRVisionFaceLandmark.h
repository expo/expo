#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionPoint;

NS_ASSUME_NONNULL_BEGIN

/**
 * Type of all facial landmarks.
 */
typedef NSString *FIRFaceLandmarkType NS_EXTENSIBLE_STRING_ENUM NS_SWIFT_NAME(FaceLandmarkType);

/** Center of the bottom lip. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeMouthBottom;

/** Right corner of the mouth */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeMouthRight;

/** Left corner of the mouth */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeMouthLeft;

/** Midpoint of the left ear tip and left ear lobe. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeLeftEar;

/** Midpoint of the right ear tip and right ear lobe. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeRightEar;

/** Left eye. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeLeftEye;

/** Right eye. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeRightEye;

/** Left cheek. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeLeftCheek;

/** Right cheek. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeRightCheek;

/** Midpoint between the nostrils where the nose meets the face. */
extern FIRFaceLandmarkType const FIRFaceLandmarkTypeNoseBase;

/**
 * A landmark on a human face detected in an image.
 */
NS_SWIFT_NAME(VisionFaceLandmark)
@interface FIRVisionFaceLandmark : NSObject

/**
 * The type of the facial landmark.
 */
@property(nonatomic, readonly) FIRFaceLandmarkType type;

/**
 * 2D position of the facial landmark.
 */
@property(nonatomic, readonly) FIRVisionPoint *position;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
