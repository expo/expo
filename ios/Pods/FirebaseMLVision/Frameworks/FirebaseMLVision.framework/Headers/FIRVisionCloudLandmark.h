#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionLatitudeLongitude;

NS_ASSUME_NONNULL_BEGIN

/** Set of landmark properties identified by a vision cloud detector. */
NS_SWIFT_NAME(VisionCloudLandmark)
@interface FIRVisionCloudLandmark : NSObject

/**
 * Opaque entity ID. Some IDs may be available in [Google Knowledge Graph Search API]
 * (https://developers.google.com/knowledge-graph/).
 */
@property(nonatomic, copy, readonly, nullable) NSString *entityId;

/** Textual description of the landmark. */
@property(nonatomic, copy, readonly, nullable) NSString *landmark;

/** Overall confidence of the result. The value is float, in range [0, 1]. */
@property(nonatomic, readonly, nullable) NSNumber *confidence;

/** A rectangle image region to which this landmark belongs to (in the view coordinate system). */
@property(nonatomic, readonly) CGRect frame;

/**
 * The location information for the detected landmark. Multiple LocationInfo elements can be present
 * because one location may indicate the location of the scene in the image, and another location
 * may indicate the location of the place where the image was taken.
 */
@property(nonatomic, readonly, nullable) NSArray<FIRVisionLatitudeLongitude *> *locations;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
