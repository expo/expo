#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Represents a label for an image. */
NS_SWIFT_NAME(VisionImageLabel)
@interface FIRVisionImageLabel : NSObject

/**
 * The human readable label text in American English. For example: "Balloon".
 *
 * @discussion This string is not fit for display purposes, as it is not localized. Use the
 *     `entityID` and query the Knowledge Graph to get a localized description of the label text.
 */
@property(nonatomic, copy, readonly) NSString *text;

/** Confidence for the label in range [0, 1]. The value is a `floatValue`. */
@property(nonatomic, readonly, nullable) NSNumber *confidence;

/**
 * Opaque entity ID used to query the Knowledge Graph to get a localized description of the label
 * text. Some IDs may be available in [Google Knowledge Graph Search API]
 * (https://developers.google.com/knowledge-graph/).
 */
@property(nonatomic, copy, readonly, nullable) NSString *entityID;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
