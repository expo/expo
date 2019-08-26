#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An object representing a latitude/longitude pair.  This is expressed as a pair of doubles
 * representing degrees latitude and degrees longitude.  Unless specified otherwise, this must
 * conform to the <a href="http://www.unoosa.org/pdf/icg/2012/template/WGS_84.pdf">WGS84
 * standard</a>.  Values must be within normalized ranges.
 */
NS_SWIFT_NAME(VisionLatitudeLongitude)
@interface FIRVisionLatitudeLongitude : NSObject

/**
 * The latitude in degrees. It must be in the range [-90.0, +90.0]. The value is double.
 */
@property(nonatomic, nullable) NSNumber *latitude;

/**
 * The longitude in degrees. It must be in the range [-180.0, +180.0]. The value is double.
 */
@property(nonatomic, nullable) NSNumber *longitude;

/**
 * Initializes a VisionLatitudeLongitude with the given latitude and longitude.
 *
 * @param latitude Latitude of the location.  The value is double.
 * @param longitude Longitude of the location.  The value is double.
 * @return A VisionLatitudeLongitude instance with the given latigude and longitude.
 */
- (instancetype)initWithLatitude:(nullable NSNumber *)latitude
                       longitude:(nullable NSNumber *)longitude NS_DESIGNATED_INITIALIZER;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
